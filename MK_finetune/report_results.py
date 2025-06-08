import json
import requests
from pathlib import Path
from dotenv import load_dotenv
import os
from openai import OpenAI

def load_openai_api_key():
    """Load OpenAI API key from environment or .env file"""
    parent_dir = Path(__file__).parent.parent
    env_path = parent_dir / '.env'
    load_dotenv(env_path)
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables or .env file")
    return api_key

def load_report_api_key():
    """Load CENTRALA API key from environment or .env file"""
    parent_dir = Path(__file__).parent.parent
    env_path = parent_dir / '.env'
    load_dotenv(env_path)
    api_key = os.getenv("API_KEY")
    if not api_key:
        raise ValueError("API_KEY not found in environment variables or .env file")
    return api_key

def get_predictions(client, model_id, input_file):
    """Get predictions from the model for each line in the input file"""
    predictions = []
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                messages = data["messages"]
                
                # Get model's response
                response = client.chat.completions.create(
                    model=model_id,
                    messages=messages,
                    temperature=0,
                    max_tokens=1
                )
                
                # Get the prediction
                prediction = response.choices[0].message.content.strip()
                predictions.append(prediction)
                
            except Exception as e:
                print(f"Error processing line: {e}")
                continue
    
    return predictions

def format_answer(predictions):
    """Format predictions into the required answer format"""
    # Convert predictions to two-digit strings and filter out any invalid predictions
    formatted_predictions = []
    for i, pred in enumerate(predictions, 1):
        if pred == '1':  # Only include lines where prediction is 1
            formatted_predictions.append(f"{i:02d}")
    
    return formatted_predictions

def send_report(predictions, report_api_key):
    """Send the report to the endpoint"""
    report_url = "https://c3ntrala.ag3nts.org/report"
    
    # Format the answer
    answer = format_answer(predictions)
    
    # Prepare the payload
    payload = {
        "task": "research",
        "apikey": report_api_key,
        "answer": answer
    }
    
    # Print the payload for debugging
    print("\nSending payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        headers = {
            'Content-Type': 'application/json'
        }
        response = requests.post(report_url, json=payload, headers=headers)
        response.raise_for_status()
        print(f"\nReport sent successfully. Response: {response.text}")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"\nError sending report: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response text: {e.response.text}")
        raise

def main():
    # Initialize OpenAI client
    client = OpenAI(api_key=load_openai_api_key())
    
    # Path to the input file
    input_path = Path("input.jsonl")
    
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Your fine-tuned model ID
    model_id = "ft:gpt-4o-mini-2024-07-18:mirek::Bfon3HYa"
    
    report_api_key = load_report_api_key()
    
    try:
        # Get predictions
        print("Getting predictions from model...")
        predictions = get_predictions(client, model_id, input_path)
        
        # Print predictions for verification
        print("\nPredictions:")
        for i, pred in enumerate(predictions, 1):
            print(f"Line {i:02d}: {pred}")
        
        # Send report
        print("\nSending report...")
        send_report(predictions, report_api_key)
        
    except Exception as e:
        print(f"An error occurred: {e}")
        raise

if __name__ == "__main__":
    main() 