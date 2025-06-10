# AI Phone Agent

An intelligent agent that analyzes conversations and answers questions based on context using OpenAI's GPT-4 model. The agent is designed to handle Polish text and can systematically solve questions about conversations, identities, and technical details.

## Features

- Context-aware question answering
- Support for Polish language and characters
- Systematic name extraction and validation
- Caching of answers to prevent duplicate API calls
- Automatic retry mechanism for incorrect answers
- Endpoint validation and testing
- Persistent storage of answers and wrong attempts

## Prerequisites

- Node.js (v14 or higher)
- npm or bun package manager
- OpenAI API key

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd MK_agent
```

2. Install dependencies:

```bash
npm install
# or
bun install
```

3. Create a `.env` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_api_key_here
API_KEY=your_agent_api_key_here
```

## Usage

1. Place your context file (conversation text) in the root directory as `context.txt`

2. Run the agent:

```bash
bun .\src\Agent.ts

```

The agent will:

- Read the context file
- Process each question systematically
- Cache answers to prevent duplicate API calls
- Validate and test endpoints when necessary
- Submit answers to the configured API endpoint
- Retry with different answers if submissions are incorrect

## Project Structure

```
.
├── src/
│   ├── agent.ts          # Main agent logic
│   ├── OpenAIService.ts  # OpenAI API integration
│   ├── DBService.ts      # Answer caching and storage
│   └── WebService.ts     # HTTP requests and endpoint testing
├── context.txt          # Conversation context
├── answers.json         # Cached answers
├── wrong_answers.json   # Tracked incorrect attempts
└── package.json         # Project configuration
```

## Configuration

The agent can be configured through environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `API_KEY`: Your agent API key for submissions

## Example Questions

The agent is designed to answer questions like:

- Identifying who lied in a conversation
- Finding correct API endpoints
- Extracting nicknames and relationships
- Identifying conversation participants
- Testing API endpoints with passwords
- Finding specific individuals based on context

## Error Handling

The agent includes robust error handling:

- Automatic retries for failed submissions
- Tracking of incorrect answers
- Systematic name extraction and validation
- Endpoint validation before submission

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
