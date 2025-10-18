#!/usr/bin/env python3
"""
repair_paths.py

Parses an HTML file (e.g., index.html) as entry point, repairs local asset and link paths,
and tests that the referenced files exist. Generates a fixed HTML file with updated paths
and prints a summary report.

Usage:
    python repair_paths.py /path/to/index.html

Requires:
    beautifulsoup4
"""
import os
import argparse
from pathlib import Path
from bs4 import BeautifulSoup

def find_file(root: Path, filename: str) -> Path | None:
    """
    Search for `filename` under `root` directory. Return the relative Path if found, else None.
    """
    for dirpath, _, files in os.walk(root):
        if filename in files:
            found = Path(dirpath) / filename
            return found.relative_to(root)
    return None


def repair_paths(html_path: Path) -> tuple[list[tuple[str, str, str, str, bool]], Path]:
    """
    Parse HTML, repair local src/href attributes, test file existence.
    Returns a list of tuples:
      (tag_name, attribute, original_path, new_path, exists_flag)
    and the path to the fixed output file.
    """
    root = html_path.parent
    soup = BeautifulSoup(html_path.read_text(encoding='utf-8'), 'html.parser')
    tags_to_check = {'img': 'src', 'script': 'src', 'link': 'href', 'a': 'href'}
    report = []

    for tag_name, attr in tags_to_check.items():
        for tag in soup.find_all(tag_name):
            if not tag.has_attr(attr):
                continue
            orig = tag[attr]
            # Skip external, anchor or protocol links
            if orig.startswith(('http://', 'https://', '//', 'mailto:', '#')):
                continue
            # Normalize path: treat leading slash as relative to root
            rel = orig.lstrip('/')
            candidate = root / rel
            if candidate.exists():
                new = rel.replace(os.sep, '/')
                exists = True
            else:
                # attempt to locate by filename
                filename = os.path.basename(rel)
                found = find_file(root, filename)
                if found:
                    new = str(found).replace(os.sep, '/')
                    exists = True
                else:
                    new = orig
                    exists = False

            if new != orig:
                tag[attr] = new
            report.append((tag_name, attr, orig, new, exists))

    # Write out fixed HTML
    fixed_path = root / f"{html_path.stem}_fixed.html"
    fixed_path.write_text(str(soup), encoding='utf-8')
    return report, fixed_path


def main():
    parser = argparse.ArgumentParser(description="Repair paths in an HTML file and test asset existence.")
    parser.add_argument('html_file', help='Path to the entry HTML file (e.g., index.html)')
    args = parser.parse_args()

    html_path = Path(args.html_file)
    if not html_path.exists():
        print(f"Error: {html_path} does not exist.")
        return

    report, fixed_file = repair_paths(html_path)
    print(f"Repaired file written to: {fixed_file}\n")
    print("Summary of path repairs:")
    for tag, attr, orig, new, exists in report:
        status = 'OK' if exists else 'MISSING'
        print(f"{tag:<6} [{attr}]: {orig} -> {new} [{status}]")

if __name__ == '__main__':
    main()
