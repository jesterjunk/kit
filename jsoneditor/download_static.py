import os
import time
import random
import requests
import urllib.parse
import typing
import logging
import tqdm
import concurrent.futures

BASE_DIR = "jsoneditor_static"

# Setup logging
logging.basicConfig(
    filename='download_static.log',
    filemode='a',
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

def load_urls(file_path: str) -> typing.List[str]:
    """Load URLs from a file."""
    with open(file_path, 'r') as f:
        return [line.strip() for line in f if line.strip()]


def get_local_path(base_dir: str, url: str) -> str:
    """Generate local file path based on URL."""
    parsed_url = urllib.parse.urlparse(url)
    path = parsed_url.path

    if path == '/' or path == '':
        return os.path.join(base_dir, 'index.html')
    elif url.endswith('/') and path != '/':
        return os.path.join(base_dir, path.lstrip('/'), 'index.html')
    else:
        return os.path.join(base_dir, path.lstrip('/'))


def get_default_headers() -> dict:
    """Return standard browser-like HTTP headers."""
    return {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'priority': 'u=0, i',
        'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    }


def download_with_retry(url: str, headers: dict) -> bytes:
    """Download content with exponential backoff retry."""
    delays = [2, 4, 8, 16, 32, 64, 128]
    attempt = 0

    while attempt <= len(delays):
        try:
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200:
                return response.content
            else:
                raise Exception(f"Status Code: {response.status_code}")
        except Exception as e:
            if attempt == len(delays):
                raise Exception(f"Failed after retries: {url} | Last error: {e}")
            wait_time = delays[attempt]
            logging.warning(f"Retry {attempt + 1} for {url} after {wait_time}s due to error: {e}")
            time.sleep(wait_time)
            attempt += 1


def download_content(url: str) -> bytes:
    """Wrapper to call download with retry."""
    headers = get_default_headers()
    return download_with_retry(url, headers)


def save_content(local_path: str, content: bytes) -> None:
    """Save content to the specified local path."""
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    with open(local_path, 'wb') as f:
        f.write(content)


def random_delay(min_delay: float = 0.25, max_delay: float = 0.375) -> None:
    """Sleep for a random duration between min_delay and max_delay."""
    time.sleep(random.uniform(min_delay, max_delay))


def process_url(base_dir: str, url: str) -> None:
    """Process a single URL: download, save, and delay."""
    try:
        local_path = get_local_path(base_dir, url)
        logging.info(f"Downloading: {url}")
        content = download_content(url)
        save_content(local_path, content)
        logging.info(f"Saved to: {local_path}")
    except Exception as e:
        logging.error(f"Error processing {url}: {e}")
    finally:
        random_delay()


def main():
    urls = load_urls('urls.txt')
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(process_url, BASE_DIR, url): url for url in urls}
        for _ in tqdm.tqdm(concurrent.futures.as_completed(futures), total=len(futures), desc="Downloading files"):
            pass

if __name__ == "__main__":
    main()
