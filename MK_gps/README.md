# GPS Tracking Agent

## Overview

This project implements a GPS tracking agent that monitors the locations of individuals based on GPS signals. It is designed to track users in a specified location while excluding certain individuals from monitoring.

## Features

- GPS location tracking for specified users.
- Exclusion of specific users from tracking.
- API integration for retrieving GPS data.
- Secure handling of API keys using environment variables.

## Prerequisites

- Node.js and npm installed.
- A `.env` file with the necessary API key.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root and add your API key:
   ```
   API_KEY=your_api_key_here
   ```

## Usage

1. Run the script:
   ```bash
   npm start
   ```
2. The script will prompt you to review the data before sending it to the `/report` endpoint.

## Project Structure

- `src/index.ts`: Entry point of the application.
- `src/GPSAgent.ts`: Core functionality for GPS tracking.
- `src/types.ts`: TypeScript interfaces for data structures.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.

## Logic and Process

The GPS tracking agent follows these steps:

1. **Input Handling**: The agent reads from `input.json`, which should contain a string or an array of strings representing usernames or place names to track.
2. **Data Retrieval**: For each username or place, the agent retrieves GPS data using API calls.
3. **Data Transformation**: The retrieved data is transformed into a format suitable for reporting, mapping each username to its GPS coordinates.
4. **Reporting**: The transformed data is sent to the `/report` endpoint, with a prompt for user review before submission.

## Input.json

The `input.json` file should contain:

- A single string representing a username or place name to track.
- An array of strings representing multiple usernames or place names to track.

Example:

```json
"Lubawa"
```

or

```json
["Lubawa", "AnotherPlace"]
```
