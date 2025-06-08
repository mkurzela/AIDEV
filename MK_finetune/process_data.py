import requests
import zipfile
import json
import os
from pathlib import Path

def download_file(url, local_filename):
    """Download a file from a URL to a local path"""
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    with open(local_filename, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    return local_filename

def extract_zip(zip_path, extract_to):
    """Extract a zip file to a specified directory"""
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)

def process_file(file_path, is_correct):
    """Process a single file and return list of JSONL entries"""
    jsonl_entries = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                try:
                    line = line.strip()
                    if line:  # Skip empty lines
                        entry = {
                            "messages": [
                                {"role": "system", "content": "validate data"},
                                {"role": "user", "content": line},
                                {"role": "assistant", "content": "1" if is_correct else "0"}
                            ]
                        }
                        jsonl_entries.append(json.dumps(entry, ensure_ascii=False))
                except UnicodeDecodeError as e:
                    print(f"Warning: Unicode decode error in {file_path} at line {line_num}: {e}")
                    continue
                except Exception as e:
                    print(f"Warning: Error processing line {line_num} in {file_path}: {e}")
                    continue
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        raise
    return jsonl_entries

def process_verify_file(file_path):
    """Process verify.txt file and return list of JSONL entries for verification"""
    jsonl_entries = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                try:
                    line = line.strip()
                    if line:  # Skip empty lines
                        # Remove "number=" prefix if it exists
                        if line.startswith("number="):
                            line = line[7:]  # Remove "number=" prefix
                        
                        entry = {
                            "messages": [
                                {"role": "system", "content": "validate data"},
                                {"role": "user", "content": line}
                            ]
                        }
                        jsonl_entries.append(json.dumps(entry, ensure_ascii=False))
                except UnicodeDecodeError as e:
                    print(f"Warning: Unicode decode error in {file_path} at line {line_num}: {e}")
                    continue
                except Exception as e:
                    print(f"Warning: Error processing line {line_num} in {file_path}: {e}")
                    continue
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        raise
    return jsonl_entries

def main():
    # Create data directory if it doesn't exist
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    
    # Download and extract files
    zip_url = "https://c3ntrala.ag3nts.org/dane/lab_data.zip"
    zip_path = data_dir / "lab_data.zip"
    
    print("Downloading zip file...")
    download_file(zip_url, zip_path)
    
    print("Extracting files...")
    extract_zip(zip_path, data_dir)
    
    # Process files
    print("Processing files...")
    try:
        correct_entries = process_file(data_dir / "correct.txt", True)
        incorrect_entries = process_file(data_dir / "incorect.txt", False)
        
        # Combine and write to output file
        output_path = Path("output.jsonl")
        with open(output_path, 'w', encoding='utf-8') as f:
            for entry in correct_entries + incorrect_entries:
                f.write(entry + '\n')
        
        print(f"Processing complete. Output written to {output_path}")
        
        # Process verify file
        verify_entries = process_verify_file(data_dir / "verify.txt")
        verify_path = Path("input.jsonl")
        with open(verify_path, 'w', encoding='utf-8') as f:
            for entry in verify_entries:
                f.write(entry + '\n')
        
        print(f"Verification data written to {verify_path}")
        
    except Exception as e:
        print(f"Error during processing: {e}")
        raise
    finally:
        # Clean up zip file
        if zip_path.exists():
            zip_path.unlink()

if __name__ == "__main__":
    main() 