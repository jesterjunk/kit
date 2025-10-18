import hashlib
import os
from pathlib import Path

def compute_hash(file_path, hash_func):
    hasher = hash_func()
    with open(file_path, 'rb') as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def write_hash_to_file(hash_value, output_file, file_path, root_dir):
    # Make file path relative to script root and format as POSIX (with forward slashes)
    relative_path = file_path.relative_to(root_dir).as_posix()
    with open(output_file, 'w') as f:
        f.write(f"{hash_value} ../{relative_path}\n")

def process_directory(directory, output_dir, hash_algorithms):
    for root, _, files in os.walk(directory):
        current_dir = Path(root)

        # Skip the sha output directory
        if current_dir == output_dir:
            continue

        for file in files:
            file_path = current_dir / file

            # Skip hash files themselves
            if file_path.parent == output_dir:
                continue

            # Skip this script itself
            if file_path.resolve() == Path(__file__).resolve():
                continue

            for ext, hash_func in hash_algorithms.items():
                hash_file = output_dir / f"{file}.{ext}"
                if not hash_file.exists():
                    hash_value = compute_hash(file_path, hash_func)
                    write_hash_to_file(hash_value, hash_file, file_path, directory)
                    print(f"Generated {ext} hash for: {file_path.name}")

def main():
    script_dir = Path(__file__).resolve().parent
    output_dir = script_dir / "sha"
    output_dir.mkdir(exist_ok=True)

    hash_algorithms = {
        'md5': hashlib.md5,
        'sha1': hashlib.sha1,
        'sha256': hashlib.sha256,
        'sha512': hashlib.sha512,
        'sha3-256': hashlib.sha3_256,
        'sha3-512': hashlib.sha3_512
    }

    process_directory(script_dir, output_dir, hash_algorithms)

if __name__ == "__main__":
    main()
