# MK_graph

A TypeScript application for managing and analyzing user connections using a Neo4j graph database and OpenAI embeddings. The app fetches data from a remote API, stores it in a Neo4j database, and provides tools for querying relationships and paths between users.

## Features

- Fetches user and connection data from a remote API
- Stores and manages data in a Neo4j graph database
- Uses OpenAI embeddings for advanced search and analysis
- Provides utilities for finding shortest paths and relationships between users
- Caches database structure and content for efficiency

## Prerequisites

- [Bun](https://bun.sh/) (for running and managing the project)
- [Node.js](https://nodejs.org/) (for TypeScript and some dependencies)
- [Neo4j](https://neo4j.com/) running locally (recommended via Docker)
- OpenAI API key
- API key for the remote data source

## Running Neo4j with Docker

You can run Neo4j locally using Docker with the following command:

```sh
docker run \
  --name neo4j \
  -p7474:7474 -p7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password \
  -d neo4j:latest
```

Update your `.env` file with the correct connection details.

## Setup

1. Clone the repository and navigate to the `MK_graph` directory:
   ```sh
   git clone https://github.com/mkurzela/AIDEV.git
   cd AIDEV/MK_graph
   ```
2. Install dependencies:
   ```sh
   bun install
   ```
3. Create a `.env` file in the `MK_graph` directory with the following keys:
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   API_KEY=your_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```
   Replace the values with your actual credentials.

## Usage

- To start the application, run:
  ```sh
  bun start
  ```
- The main logic is in `app.ts`, which initializes the database, fetches data, and provides querying utilities.

## Project Structure

- `app.ts` - Main application entry point
- `ApiService.ts` - Handles API requests to the remote data source
- `Neo4jService.ts` - Manages Neo4j database operations
- `OpenAIService.ts` - Integrates with OpenAI for embeddings and completions
- `DatabaseStructure.ts` - Explores and caches the database structure
- `db_structure/` - Stores cached database info
- `prompts.ts` - Contains system prompts for AI logic

## Notes

- Ensure your `.env` file is present and contains all required keys.
- Neo4j must be running locally (see Docker instructions above).
- All commands are run using Bun (e.g., `bun start`).

## License

MIT
