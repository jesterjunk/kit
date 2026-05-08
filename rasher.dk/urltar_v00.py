#!/usr/bin/env python3
"""
Download URLs through a rotating list of SOCKS5h (Tor) proxies and bundle
all successful downloads directly into a single tar archive (urls_downloaded.tar).

No individual PNG files are stored on disk; they are kept in memory until
flushed into the tar archive in batches.

Config:
    - config.ini                # runtime configuration (batch size, proxies, parallelism, jitter, etc.)

Files:
    - urls.txt                  # filename + URL per line (or legacy: one URL per line) (configurable)
    - sock5h_tor_proxies.txt    # one socks5h:// proxy per line (configurable)
    - urls_downloaded.tar       # output archive (configurable)
    - .download_progress.json   # progress state (configurable)

Dependencies:
    pip install "requests[socks]" rich
"""

from __future__ import annotations

import concurrent.futures
import configparser
import io
import json
import os
import threading
import time
from pathlib import Path
from typing import Dict, List, Set, Tuple, Union
from urllib.parse import urlparse, unquote

import secrets
import tarfile

import requests
from requests import Session

from rich.console import Console
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    TextColumn,
    TimeElapsedColumn,
)

# ---------------------------------------------------------------------------
# Base paths & configuration
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
CONFIG_FILE = BASE_DIR / "config.ini"

config = configparser.ConfigParser()
if CONFIG_FILE.is_file():
    config.read(CONFIG_FILE)

# Paths
URLS_FILE = BASE_DIR / config.get("paths", "urls_file", fallback="urls.txt")
PROXIES_FILE = BASE_DIR / config.get(
    "paths", "proxies_file", fallback="sock5h_tor_proxies.txt"
)
PROGRESS_FILE = BASE_DIR / config.get(
    "paths", "progress_file", fallback=".download_progress.json"
)
TAR_FILE = BASE_DIR / config.get(
    "paths", "tar_file", fallback="urls_downloaded.tar"
)

# Memory batching
BATCH_SIZE = config.getint("batch", "size", fallback=100)

# Proxy behaviour
PROXY_FAIL_THRESHOLD = config.getint("proxy", "fail_threshold", fallback=10)
MIN_ACTIVE_PROXIES = config.getint("proxy", "min_active", fallback=10)
PROXY_COOLDOWN_SECONDS = config.getfloat(
    "proxy", "cooldown_seconds", fallback=2.0
)

# Parallelism
MAX_WORKERS = config.getint("parallel", "max_workers", fallback=16)

# Per-URL retry behaviour
PER_URL_MAX_RETRIES = config.getint("retry", "per_url_max_retries", fallback=3)

# Jitter configuration
JITTER_MIN_MS = config.getfloat("jitter", "min_delay_ms", fallback=100.0)
JITTER_MAX_MS = config.getfloat("jitter", "max_delay_ms", fallback=200.0)

console = Console()


def compute_secure_jitter_seconds(          # default values
    min_delay_ms: Union[int, float] = 250,  # 250
    max_delay_ms: Union[int, float] = 375   # 375
) -> float:
    """
    Return a securely and uniformly distributed random delay in seconds
    between `min_delay_ms` and `max_delay_ms`.

    This value is suitable for use with time.sleep() or retry mechanisms
    that benefit from jitter to avoid synchronized retries.

    Args:
        min_delay_ms (int | float): Minimum delay in milliseconds.
        max_delay_ms (int | float): Maximum delay in milliseconds.

    Returns:
        float: Delay in seconds.

    Raises:
        ValueError: If min_delay_ms > max_delay_ms.
    """
    if min_delay_ms > max_delay_ms:
        raise ValueError("min_delay_ms must be less than or equal to max_delay_ms")

    # Convert range to float for precision and scale to avoid floating point bias
    scale = 1_000_000  # use microsecond precision to preserve decimal accuracy
    min_scaled = int(min_delay_ms * scale)
    max_scaled = int(max_delay_ms * scale)

    delay_scaled = secrets.randbelow(max_scaled - min_scaled + 1) + min_scaled
    return delay_scaled / (scale * 1000.0)  # convert microseconds to seconds


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------


def filename_from_url(url: str) -> str:
    """
    Extract the original filename from the URL path.
    Example: https://example.com/path/to/png/10000ecd.png -> 10000ecd.png

    If no filename can be derived, fall back to a synthetic name.
    """
    parsed = urlparse(url)
    name = Path(unquote(parsed.path)).name
    if not name:
        name = secrets.token_hex(8) + ".png"
    return name


def load_urls(path: Path) -> List[Tuple[str, str]]:
    if not path.is_file():
        raise FileNotFoundError(f"URLs file not found: {path}")
    entries: List[Tuple[str, str]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            # Skip optional header lines like: "FILENAME    URL"
            upper = line.upper()
            if upper.startswith("FILENAME") and "URL" in upper:
                continue

            parts = line.split(None, 1)  # split on whitespace into 2 columns max
            if (
                len(parts) == 2
                and (parts[1].startswith("http://") or parts[1].startswith("https://"))
            ):
                fname = parts[0].strip()
                url = parts[1].strip()
            else:
                url = line
                fname = filename_from_url(url)

            entries.append((fname, url))

    if not entries:
        raise ValueError(f"No URLs found in {path}")
    return entries


def load_proxies(path: Path) -> List[str]:
    if not path.is_file():
        raise FileNotFoundError(f"Proxy file not found: {path}")
    proxies: List[str] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            proxy = line.strip()
            if not proxy or proxy.startswith("#"):
                continue
            # Enforce SOCKS5H only, so DNS is resolved through Tor
            if not proxy.startswith("socks5h://"):
                raise ValueError(
                    f"Invalid proxy (must use socks5h:// for remote DNS): {proxy}"
                )
            proxies.append(proxy)
    if not proxies:
        raise ValueError(f"No proxies found in {path}")
    return proxies


def get_live_proxies(proxies: List[str], dead_proxies: Set[str]) -> List[str]:
    """Return the list of proxies that are not marked dead."""
    return [p for p in proxies if p not in dead_proxies]


def load_progress(
    path: Path,
) -> Tuple[Set[str], Set[str], Set[str], Dict[str, int]]:
    """
    Load progress file.

    Returns:
        completed_files, failed_files, dead_proxies, proxy_fail_counts

    Progress is tracked by filename.
    """
    if not path.is_file():
        return set(), set(), set(), {}

    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        # Corrupt or unreadable progress file; start fresh
        return set(), set(), set(), {}

    if "completed_files" in data or "failed_files" in data:
        completed_files = {str(s) for s in data.get("completed_files", [])}
        failed_files = {str(s) for s in data.get("failed_files", [])}
    else:
        completed_files = set()
        failed_files = set()

    dead_proxies = set(data.get("dead_proxies", []))
    proxy_fail_counts = {
        str(k): int(v) for k, v in data.get("proxy_fail_counts", {}).items()
    }

    return completed_files, failed_files, dead_proxies, proxy_fail_counts


def save_progress(
    path: Path,
    total_files: int,
    completed_files: Set[str],
    failed_files: Set[str],
    dead_proxies: Set[str],
    proxy_fail_counts: Dict[str, int],
) -> None:
    """Atomically save progress (completed, failed files & proxy state) to disk."""
    data = {
        "total_urls": int(total_files),
        "completed_files": sorted(completed_files),
        "failed_files": sorted(failed_files),
        "dead_proxies": sorted(dead_proxies),
        "proxy_fail_counts": {k: int(v) for k, v in proxy_fail_counts.items()},
    }
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    os.replace(tmp_path, path)


def download_url_to_bytes(
    session: Session,
    url: str,
    proxy: str,
    timeout: float = 60.0,
) -> bytes:
    """
    Download a single URL via a SOCKS5h proxy into memory.

    Raises RequestException or IOError on failure.
    """
    proxies = {
        "http": proxy,
        "https": proxy,
    }

    # Ensure we never accidentally use environment proxy settings
    session.trust_env = False

    with session.get(
        url,
        stream=True,
        timeout=timeout,
        proxies=proxies,
    ) as resp:
        resp.raise_for_status()
        chunks: List[bytes] = []
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:  # filter out keep-alive chunks
                chunks.append(chunk)
        return b"".join(chunks)


def flush_batch_to_tar(
    tar: tarfile.TarFile,
    batch: List[Tuple[str, bytes]],
    progress_path: Path,
    total_files: int,
    completed_files: Set[str],
    failed_files: Set[str],
    dead_proxies: Set[str],
    proxy_fail_counts: Dict[str, int],
) -> None:
    """
    Flush a batch of in-memory downloads into the tar archive and
    update progress file once they are safely written.

    batch entries are (filename, data).
    """
    if not batch:
        return

    for member_name, data in batch:
        info = tarfile.TarInfo(name=member_name)
        info.size = len(data)
        tar.addfile(info, io.BytesIO(data))

    # Persist progress AFTER writing to tar
    save_progress(
        progress_path,
        total_files,
        completed_files,
        failed_files,
        dead_proxies,
        proxy_fail_counts,
    )

    # Ensure underlying file is flushed
    fileobj = getattr(tar, "fileobj", None)
    if fileobj is not None and hasattr(fileobj, "flush"):
        fileobj.flush()

    batch.clear()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    console.print(
        "[bold]URL Downloader with SOCKS5h (Tor) Proxies → In-Memory → Tar (parallel)[/bold]\n"
    )

    try:
        raw_entries = load_urls(URLS_FILE)
        proxies = load_proxies(PROXIES_FILE)
    except Exception as e:
        console.print(f"[red]Initialization error:[/red] {e}")
        return 1

    # Build mapping from filename -> URL (filenames are the stable IDs)
    file_to_url: Dict[str, str] = {}
    for fname, url in raw_entries:
        if fname in file_to_url:
            console.log(
                f"[yellow]Duplicate filename detected: {fname}, overriding previous URL.[/yellow]"
            )
        file_to_url[fname] = url

    current_files: Set[str] = set(file_to_url.keys())
    total_files = len(current_files)

    (
        completed_files,
        failed_files,
        dead_proxies,
        proxy_fail_counts,
    ) = load_progress(PROGRESS_FILE)

    completed_current = completed_files & current_files
    failed_current = failed_files & current_files

    # Initial live proxies check (no threads yet, so no lock needed)
    live = get_live_proxies(proxies, dead_proxies)
    if len(live) <= MIN_ACTIVE_PROXIES:
        console.print(
            f"[red]Only {len(live)} active proxies available (≤ {MIN_ACTIVE_PROXIES}). "
            "Stopping.[/red]"
        )
        save_progress(
            PROGRESS_FILE,
            total_files,
            completed_files,
            failed_files,
            dead_proxies,
            proxy_fail_counts,
        )
        return 0

    if len(completed_current) >= total_files and not failed_current:
        console.print(
            "[green]All URLs already processed according to progress file and current urls.txt.[/green]"
        )
        console.print(f"[green]Existing archive:[/green] {TAR_FILE}")
        return 0

    console.print(f"Total files in current urls.txt: [cyan]{total_files}[/cyan]")
    console.print(
        f"Completed so far (current set): [cyan]{len(completed_current)}[/cyan]"
    )
    if failed_current:
        console.print(
            f"Failed files pending retry (current set): [yellow]{len(failed_current)}[/yellow]"
        )
    if dead_proxies:
        console.print(
            f"Proxies marked dead from previous runs: [red]{len(dead_proxies)}[/red]"
        )
    console.print(f"Active proxies at start: [cyan]{len(live)}[/cyan]")
    console.print("")

    # Decide tar mode: append if it already exists and is non-empty; otherwise create
    if TAR_FILE.exists() and TAR_FILE.stat().st_size > 0:
        tar_mode = "a"
    else:
        tar_mode = "w"

    # Work order: failed first, then new ones
    pending_files = [
        fname
        for fname in current_files
        if fname not in completed_current and fname not in failed_current
    ]
    work_order = sorted(failed_current) + sorted(pending_files)
    work_iter = iter(work_order)

    # Shared state for proxies & sessions
    proxy_cooldowns: Dict[str, float] = {p: 0.0 for p in proxies}
    proxy_state_lock = threading.Lock()
    last_proxy_used: Dict[str, str] = {"proxy": ""}  # mutable wrapper for nonlocal
    thread_local = threading.local()

    def acquire_proxy(avoid: Set[str] | None = None) -> str:
        """
        Select a proxy respecting:
        - only live (non-dead) proxies
        - cooldown per proxy
        - avoid using the same proxy back-to-back if possible
        - optionally avoid a per-call 'avoid' set (for per-URL retries)
        """
        while True:
            with proxy_state_lock:
                live_proxies = get_live_proxies(proxies, dead_proxies)
                if not live_proxies:
                    raise RuntimeError("No live proxies available")
                now = time.time()

                # First, proxies whose cooldown has expired
                available = [
                    p for p in live_proxies if now >= proxy_cooldowns.get(p, 0.0)
                ]
                if not available:
                    proxy = None
                else:
                    # Apply per-URL avoid list if possible
                    if avoid:
                        candidates = [p for p in available if p not in avoid]
                    else:
                        candidates = list(available)

                    # If avoid knocks out everything, fall back to available set
                    if not candidates:
                        candidates = list(available)

                    # Enforce "no back-to-back" when we have >1 candidate
                    last = last_proxy_used["proxy"]
                    if last in candidates and len(candidates) > 1:
                        candidates = [p for p in candidates if p != last]

                    if not candidates:
                        proxy = None
                    else:
                        proxy = secrets.choice(candidates)

                if proxy is not None:
                    last_proxy_used["proxy"] = proxy
                    return proxy

            # No proxy currently available (cooldowns / avoidance) -> brief wait
            time.sleep(0.05)

    def release_proxy(proxy: str) -> None:
        """Set cooldown for a proxy after use."""
        with proxy_state_lock:
            proxy_cooldowns[proxy] = time.time() + PROXY_COOLDOWN_SECONDS

    def get_session() -> Session:
        """Per-thread Session, safe for concurrent use."""
        if not hasattr(thread_local, "session"):
            s = requests.Session()
            s.trust_env = False
            setattr(thread_local, "session", s)
        return getattr(thread_local, "session")

    def worker_download(fname: str) -> Dict[str, object]:
        """
        Worker function for the thread pool.

        Retries up to PER_URL_MAX_RETRIES times per run. Each retry attempts
        to use a different proxy (when possible).

        Returns a dict:
            {
                "filename": str,
                "success": bool,
                "data": bytes | None,
                "proxy": str | None,         # proxy for successful attempt
                "error": str | None,         # last error if all attempts failed
                "attempts": [                # for failures, details per attempt
                    {"proxy": str | None, "error": str}
                ]
            }
        """
        url = file_to_url[fname]
        session = get_session()
        used_proxies_for_this_file: Set[str] = set()
        attempts_info: List[Dict[str, str]] = []
        last_error_repr: str | None = None

        for attempt in range(1, PER_URL_MAX_RETRIES + 1):
            proxy: str | None = None
            try:
                proxy = acquire_proxy(avoid=used_proxies_for_this_file)
                used_proxies_for_this_file.add(proxy)
                data = download_url_to_bytes(session, url, proxy)
                # Jitter after each successful request
                delay = compute_secure_jitter_seconds(
                    min_delay_ms=JITTER_MIN_MS,
                    max_delay_ms=JITTER_MAX_MS,
                )
                time.sleep(delay)
                # Cooldown this proxy after use
                release_proxy(proxy)
                return {
                    "filename": fname,
                    "success": True,
                    "data": data,
                    "proxy": proxy,
                    "error": None,
                }
            except Exception as e:
                last_error_repr = repr(e)
                attempts_info.append(
                    {
                        "proxy": proxy,
                        "error": last_error_repr,
                    }
                )
                if proxy is not None:
                    # Even on failure, enforce cooldown
                    release_proxy(proxy)
                # Next loop iteration: try a (preferably) different proxy
                continue

        # All attempts failed for this run
        return {
            "filename": fname,
            "success": False,
            "data": None,
            "proxy": None,
            "error": last_error_repr,
            "attempts": attempts_info,
        }

    # Shared batch for successful downloads
    batch: List[Tuple[str, bytes]] = []
    stop_due_to_proxies = False

    progress = Progress(
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        TimeElapsedColumn(),
        console=console,
        transient=False,
    )

    with tarfile.open(TAR_FILE, tar_mode) as tar, progress, concurrent.futures.ThreadPoolExecutor(
        max_workers=MAX_WORKERS
    ) as executor:
        task_id = progress.add_task(
            "Downloading URLs",
            total=total_files,
            completed=len(completed_current),
        )

        futures: Dict[concurrent.futures.Future, str] = {}

        def submit_more() -> None:
            nonlocal stop_due_to_proxies
            if stop_due_to_proxies:
                return
            try:
                while len(futures) < MAX_WORKERS:
                    fname = next(work_iter)
                    if fname in completed_files:
                        continue
                    with proxy_state_lock:
                        live_now = get_live_proxies(proxies, dead_proxies)
                    if len(live_now) <= MIN_ACTIVE_PROXIES:
                        console.print(
                            f"[red]Active proxies dropped to {len(live_now)} (≤ {MIN_ACTIVE_PROXIES}). "
                            "Stopping new submissions.[/red]"
                        )
                        save_progress(
                            PROGRESS_FILE,
                            total_files,
                            completed_files,
                            failed_files,
                            dead_proxies,
                            proxy_fail_counts,
                        )
                        stop_due_to_proxies = True
                        return
                    fut = executor.submit(worker_download, fname)
                    futures[fut] = fname
            except StopIteration:
                return

        try:
            submit_more()
            while futures:
                done, _ = concurrent.futures.wait(
                    list(futures.keys()),
                    return_when=concurrent.futures.FIRST_COMPLETED,
                )
                for fut in done:
                    fname = futures.pop(fut)
                    try:
                        result = fut.result()
                    except Exception as e:  # should be unlikely since we catch in worker
                        console.print(
                            f"[red]Unexpected error in worker for {fname}: {e}[/red]"
                        )
                        failed_files.add(fname)
                        completed_files.discard(fname)
                        save_progress(
                            PROGRESS_FILE,
                            total_files,
                            completed_files,
                            failed_files,
                            dead_proxies,
                            proxy_fail_counts,
                        )
                        continue

                    proxy_used = result.get("proxy")
                    if result.get("success"):
                        data = result["data"]
                        batch.append((fname, data))

                        failed_files.discard(fname)
                        completed_files.add(fname)

                        completed_current = completed_files & current_files
                        progress.update(
                            task_id,
                            completed=len(completed_current),
                            description=f"[cyan]Last OK: {fname} via {proxy_used}[/cyan]",
                        )

                        if len(batch) >= BATCH_SIZE:
                            console.log(
                                f"Flushing batch of {len(batch)} items into tar archive..."
                            )
                            flush_batch_to_tar(
                                tar,
                                batch,
                                PROGRESS_FILE,
                                total_files,
                                completed_files,
                                failed_files,
                                dead_proxies,
                                proxy_fail_counts,
                            )
                    else:
                        err = result.get("error")
                        url = file_to_url.get(fname, "UNKNOWN URL")
                        console.print(
                            f"[red]Failed to download {fname} ({url}) after {PER_URL_MAX_RETRIES} attempts: {err}[/red]"
                        )
                        failed_files.add(fname)
                        completed_files.discard(fname)

                        # Update proxy fail counts for each failed attempt of this URL
                        attempts = result.get("attempts") or []
                        newly_dead: List[str] = []
                        with proxy_state_lock:
                            for attempt_info in attempts:
                                p = attempt_info.get("proxy")
                                if not p:
                                    continue
                                proxy_fail_counts[p] = proxy_fail_counts.get(p, 0) + 1
                                if (
                                    proxy_fail_counts[p] >= PROXY_FAIL_THRESHOLD
                                    and p not in dead_proxies
                                ):
                                    dead_proxies.add(p)
                                    newly_dead.append(p)
                        for p in newly_dead:
                            console.print(
                                f"[yellow]Proxy {p} marked as dead for this and future runs.[/yellow]"
                            )

                        save_progress(
                            PROGRESS_FILE,
                            total_files,
                            completed_files,
                            failed_files,
                            dead_proxies,
                            proxy_fail_counts,
                        )

                        with proxy_state_lock:
                            live_now = get_live_proxies(proxies, dead_proxies)
                        if len(live_now) <= MIN_ACTIVE_PROXIES:
                            console.print(
                                f"[red]Active proxies dropped to {len(live_now)} (≤ {MIN_ACTIVE_PROXIES}). "
                                "Stopping new submissions.[/red]"
                            )
                            stop_due_to_proxies = True

                # After processing completed futures, top up the pool if allowed
                if not stop_due_to_proxies:
                    submit_more()

        except KeyboardInterrupt:
            console.print(
                "\n[yellow]KeyboardInterrupt detected. Stopping after in-flight tasks complete...[/yellow]"
            )
            stop_due_to_proxies = True

        finally:
            # Flush any remaining successful downloads in memory
            if batch:
                console.log(
                    f"Final flush: writing remaining batch of {len(batch)} items into tar."
                )
                flush_batch_to_tar(
                    tar,
                    batch,
                    PROGRESS_FILE,
                    total_files,
                    completed_files,
                    failed_files,
                    dead_proxies,
                    proxy_fail_counts,
                )

    live = get_live_proxies(proxies, dead_proxies)
    completed_current = completed_files & current_files
    failed_current = failed_files & current_files

    if stop_due_to_proxies:
        console.print(
            f"[yellow]Run stopped because active proxies dropped to {len(live)} "
            f"(≤ {MIN_ACTIVE_PROXIES}).[/yellow]"
        )
    console.print(
        f"[green]Run finished. Completed (current set): {len(completed_current)}/{total_files}, "
        f"Failed remaining (current set): {len(failed_current)}, "
        f"Active proxies: {len(live)}.[/green]"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
