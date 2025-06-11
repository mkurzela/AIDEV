# MK_fast - Fast Learning Agent System

## Overview

MK_fast is an agentic system designed for fast learning and answering questions. The system operates in two phases: learning and answering, with a focus on performance and accuracy.

## Architecture

### Core Components

1. **Agent** (`src/Agent.ts`)

   - Orchestrates the learning and answering phases
   - Manages the knowledge base and context
   - Handles the main application flow

2. **Services**

   - `OpenAIService` (`src/services/OpenAIService.ts`): Handles LLM interactions
   - `WebService` (`src/services/WebService.ts`): Manages external API communications
   - `KnowledgeBaseService` (`src/services/KnowledgeBaseService.ts`): Manages the knowledge base

3. **Types** (`src/types.ts`)
   - Defines TypeScript interfaces for the application

### Data Flow

1. **Learning Phase**

   - Fetches questions from two sources
   - Uses LLM to generate answers
   - Builds and maintains knowledge base
   - Stores context from static sources

2. **Answering Phase**
   - Parallel fetching of questions
   - Fast lookup in knowledge base
   - Generates and submits answers

## Features

- Fast learning and answering capabilities
- Parallel processing for better performance
- Persistent knowledge base
- Static context caching
- Automatic error handling and recovery

## Performance Optimizations

1. **Parallel Processing**

   - Concurrent fetching of external sources
   - Parallel answer generation
   - Optimized knowledge base lookups

2. **Caching**

   - Static context storage
   - Knowledge base persistence
   - Prompt optimization

3. **Time Management**
   - Efficient answer formatting
   - Optimized API calls
   - Minimal processing overhead

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Bun package manager
- OpenAI API key
- API key for the service (stored in parent directory's .env file)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Create `.env` file in parent directory with:
   ```
   API_KEY=your_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Configuration

- API endpoints are configured in `WebService`
- OpenAI settings in `OpenAIService`
- Knowledge base path in `KnowledgeBaseService`

## Usage

### Learning Phase

```bash
bun run src/index.ts
```

- Choose to continue learning
- Enter number of rounds
- System will build knowledge base

### Answering Phase

- Choose to start answering
- System will automatically:
  - Fetch questions
  - Find answers
  - Submit report

## API Integration

### External Endpoints

1. Question Sources:

   - `https://rafal.ag3nts.org/source0`
   - `https://rafal.ag3nts.org/source1`

2. Report Submission:
   - Endpoint: `https://rafal.ag3nts.org/b46c3%22`
   - Two-step authentication process
   - Payload format:
     ```json
     {
       "apikey": "YOUR_API_KEY",
       "timestamp": timestamp,
       "signature": "signature",
       "answer": "answers"
     }
     ```

## Error Handling

- Automatic retry for failed API calls
- Graceful degradation
- Detailed error logging
- Automatic fallback to learning phase

## Development

### Project Structure

```
MK_fast/
├── src/
│   ├── services/
│   │   ├── OpenAIService.ts
│   │   ├── WebService.ts
│   │   └── KnowledgeBaseService.ts
│   ├── Agent.ts
│   ├── types.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Features

1. Create new service in `services/` directory
2. Update types in `types.ts`
3. Integrate with `Agent.ts`
4. Update documentation

## Performance Considerations

- Total processing time must be under 6 seconds
- Optimize answer length
- Use efficient data structures
- Implement caching where possible

## Contributing

1. Fork the repository
2. Create feature branch
3. Submit pull request

## License

[Your License Here]
