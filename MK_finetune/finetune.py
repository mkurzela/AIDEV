import os
import time
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

def load_api_key():
    """Load OpenAI API key from environment or .env file"""
    # Look for .env file one directory up
    parent_dir = Path(__file__).parent.parent
    env_path = parent_dir / '.env'
    load_dotenv(env_path)
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables or .env file")
    return api_key

def upload_file(client, file_path):
    """Upload a file to OpenAI"""
    print(f"Uploading file: {file_path}")
    with open(file_path, "rb") as f:
        response = client.files.create(
            file=f,
            purpose="fine-tune"
        )
    print(f"File uploaded successfully. File ID: {response.id}")
    return response.id

def create_fine_tuning_job(client, training_file_id, model="gpt-4o-mini-2024-07-18"):
    """Create a fine-tuning job"""
    print(f"Creating fine-tuning job for model: {model}")
    response = client.fine_tuning.jobs.create(
        training_file=training_file_id,
        model=model
    )
    print(f"Fine-tuning job created. Job ID: {response.id}")
    return response.id

def monitor_job(client, job_id):
    """Monitor the status of a fine-tuning job"""
    while True:
        job = client.fine_tuning.jobs.retrieve(job_id)
        print(f"\nJob status: {job.status}")
        
        if job.status == "succeeded":
            print(f"\nFine-tuning completed successfully!")
            print(f"Fine-tuned model: {job.fine_tuned_model}")
            break
        elif job.status == "failed":
            print(f"\nFine-tuning failed!")
            if hasattr(job, 'error'):
                print(f"Error: {job.error}")
            break
        
        # Print progress if available
        if hasattr(job, 'trained_tokens'):
            print(f"Trained tokens: {job.trained_tokens}")
        
        time.sleep(60)  # Check every minute

def main():
    # Initialize OpenAI
    client = OpenAI(api_key=load_api_key())
    
    # Path to the JSONL file
    jsonl_path = Path("output.jsonl")
    
    if not jsonl_path.exists():
        raise FileNotFoundError(f"Training file not found: {jsonl_path}")
    
    try:
        # Upload the training file
        file_id = upload_file(client, jsonl_path)
        
        # Create fine-tuning job
        job_id = create_fine_tuning_job(client, file_id)
        
        # Monitor the job
        monitor_job(client, job_id)
        
    except Exception as e:
        print(f"An error occurred: {e}")
        raise

if __name__ == "__main__":
    main() 