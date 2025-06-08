# MK_pics

A TypeScript application for processing and analyzing images using OpenAI's vision capabilities. This project demonstrates how to use AI to process, analyze, and extract information from images, with a focus on image quality improvement and facial analysis.

## Features

- Image processing and analysis using OpenAI's vision models
- Automatic image quality assessment and improvement
- Facial analysis and person identification
- Batch processing of multiple images
- Caching system for processed results
- Checkpoint system for resuming interrupted processes
- Integration with OpenAI's API for image understanding

## Application Architecture

### Core Components

1. **PhotoOrchestrator** (`PhotoOrchestrator.ts`)

   - Manages the overall workflow and state
   - Handles image downloading and caching
   - Maintains checkpoints for process recovery
   - Coordinates between different services
   - Tracks photo states and processing progress

2. **PhotoProcessingService** (`PhotoProcessingService.ts`)

   - Handles image quality assessment
   - Manages image processing and improvement
   - Communicates with external API endpoints
   - Tracks processed and fixed images
   - Generates image descriptions

3. **OpenAIService** (`OpenAIService.ts`)
   - Manages communication with OpenAI's API
   - Handles image analysis requests
   - Processes vision model responses

### Workflow

1. **Initialization**

   - Load environment variables
   - Initialize services
   - Create cache directory if needed
   - Load or create checkpoint

2. **Image Processing Pipeline**

   - Download images from remote source
   - Assess image quality (REPAIR, BRIGHTEN, DARKEN, GOOD, SKIP)
   - Process images that need improvement
   - Track processed versions
   - Cache results for future use

3. **Quality Control**

   - Check if processed images meet quality standards
   - Verify facial visibility and relevance
   - Track successful improvements
   - Skip irrelevant or unusable images

4. **State Management**
   - Maintain photo states (original, processed, relevance)
   - Save checkpoints after each major operation
   - Enable process recovery from interruptions
   - Track processing history and errors

## Prerequisites

- [Bun](https://bun.sh/) (for running and managing the project)
- [Node.js](https://nodejs.org/) (for TypeScript and dependencies)
- OpenAI API key with access to vision models
- API key for the remote data source

## Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a `.env` file in the root directory with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   API_KEY=your_api_key_here
   ```

## Usage

### Running the Application

```bash
bun run photoApp.ts
```

### Managing Cache

The application uses a caching system to store processed images and checkpoints. To clear the cache:

```bash
bun run photoApp.ts --clear-cache
```

This will remove all cached images and checkpoints, allowing you to start fresh.

## Project Structure

- `photoApp.ts` - Main application entry point
- `PhotoProcessingService.ts` - Core image processing functionality
- `PhotoOrchestrator.ts` - Orchestrates the image processing workflow
- `OpenAIService.ts` - Handles communication with OpenAI's API
- `prompts.ts` - Contains system prompts for AI interactions
- `cache/` - Directory for storing processed results and checkpoints

## Dependencies

- OpenAI API for image processing and analysis
- TypeScript for type safety
- Node.js file system operations
- Bun for running the application

## License

MIT
