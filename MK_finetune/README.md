# MK_finetune

## Overview

This project is designed to fine-tune a GPT model using OpenAI's API. It processes input data, creates a JSONL file for fine-tuning, and reports the results to an external API endpoint.

## Project Structure

- `process_data.py`: Processes input files and creates JSONL files for fine-tuning.
- `finetune.py`: Uploads the JSONL file to OpenAI and initiates the fine-tuning process.
- `report_results.py`: Validates the fine-tuned model and sends the results to a specified API endpoint.

## Prerequisites

- Python 3.6 or higher
- OpenAI API key
- External API key for reporting

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/mkurzela/AIDEV.git
   cd AIDEV/MK_finetune
   ```

2. Install the required packages:

   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the parent directory with the following content:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   API_KEY=your_external_api_key_here
   ```

## Usage

### Step 1: Process Data

Run the following command to process the input files and create the JSONL files:

```bash
python process_data.py
```

### Step 2: Fine-tune the Model

Execute the fine-tuning script to upload the JSONL file and start the fine-tuning process:

```bash
python finetune.py
```

### Step 3: Report Results

After fine-tuning, validate the model and send the results to the external API:

```bash
python report_results.py
```

## Logic Description

- **Data Processing**: The `process_data.py` script reads input files, processes them, and generates JSONL files for fine-tuning.
- **Fine-tuning**: The `finetune.py` script uploads the JSONL file to OpenAI and initiates the fine-tuning process, monitoring the job status.
- **Reporting**: The `report_results.py` script validates the fine-tuned model and sends the results to the specified API endpoint.

## Contributing

Feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License.
