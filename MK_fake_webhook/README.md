# MK Fake Webhook

A TypeScript-based API service that handles communication with an external verification system and manages interactions with an LLM agent.

## Features

- Express-based API server with TypeScript
- Handles multiple types of requests (text, image, audio, instructions)
- Manages conversation threads with an external LLM agent
- Provides thread memory reset functionality
- Detailed logging for debugging
- Health check endpoint

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- TypeScript

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd MK_fake_webhook
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
PORT=3001
OPENAI_API_KEY=your_openai_api_key
```

## Usage

1. Start the server:

```bash
npm start
```

2. The server will be available at `http://localhost:3001`

### Available Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/reset` - Reset thread memory
  - Optional body: `{ "threadId": "your_thread_id" }`
- `POST /api/heart` - Main endpoint for handling requests
  - Required body format:
    ```json
    {
      "question": "your question",
      "threadId": "optional_thread_id"
    }
    ```

### Response Format

All responses follow the format:

```json
{
  "answer": "response content"
}
```

## Development

1. Build the TypeScript code:

```bash
npm run build
```

2. Run in development mode with hot reload:

```bash
npm run dev
```

## Project Structure

```
src/
├── app.ts              # Main application setup and routes
├── openaiService.ts    # OpenAI integration and request processing
└── types.ts           # TypeScript type definitions
```

## Notes

- The server always returns 200 OK status with a JSON response
- Thread memory can be reset using the `/api/reset` endpoint
- All requests and responses are logged for debugging purposes
- The service handles various types of content including text, images, and audio files

## License

[Your License Here]
