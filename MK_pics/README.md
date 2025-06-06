# MK_pics

A TypeScript application for processing and analyzing images using OpenAI's vision capabilities. This project demonstrates how to use AI to process, analyze, and extract information from images.

## Features

- Image processing and analysis using OpenAI's vision models
- Batch processing of multiple images
- Caching system for processed results
- Integration with OpenAI's API for image understanding
- TypeScript implementation for type safety and better development experience

## Prerequisites

- [Bun](https://bun.sh/) (for running and managing the project)
- [Node.js](https://nodejs.org/) (for TypeScript and dependencies)
- OpenAI API key with access to vision models

## Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a `.env` file in the root directory with your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Project Structure

- `photoApp.ts` - Main application entry point
- `PhotoProcessingService.ts` - Core image processing functionality
- `PhotoOrchestrator.ts` - Orchestrates the image processing workflow
- `OpenAIService.ts` - Handles communication with OpenAI's API
- `prompts.ts` - Contains system prompts for AI interactions
- `cache/` - Directory for storing processed results

## Usage

Run the application using Bun:

```bash
bun run photoApp.ts
```

## Dependencies

- OpenAI API for image processing
- TypeScript for type safety
- Node.js file system operations
- Bun for running the application

## License

MIT
