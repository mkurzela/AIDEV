# AI Agent Development

This repository contains examples and projects related to AI Agent development. Each subfolder represents a different project or example showcasing various aspects of AI agent functionality, including a new project for fine-tuning and validating GPT models.

## Projects

### MK_graph

A TypeScript application for managing and analyzing user connections using a Neo4j graph database and OpenAI embeddings. It fetches data from a remote API, stores it in a Neo4j database, and provides tools for querying relationships and paths between users.

### MK_query

A TypeScript application that helps find a person's current location by analyzing a note and querying various APIs to track their movements. It demonstrates how to use APIs and iterative search processes to locate individuals.

### MK_pics

A TypeScript application for processing and analyzing images using OpenAI's vision capabilities. It demonstrates how to use AI to process, analyze, and extract information from images, including batch processing and caching features.

### MK_finetune

A Python project for fine-tuning GPT models using OpenAI's API. It includes scripts for processing data, running fine-tuning jobs, and validating/reporting results to an external API. See the `MK_finetune/README.md` for details and usage instructions.

## Getting Started

Each project has its own README with specific setup and usage instructions. Navigate to the respective subfolder for more details.

## Prerequisites

- [Bun](https://bun.sh/) (for running and managing the TypeScript projects)
- [Node.js](https://nodejs.org/) (for TypeScript and some dependencies)
- [Neo4j](https://neo4j.com/) (for MK_graph project)
- OpenAI API key (with vision model access for MK_pics and fine-tuning for MK_finetune)
- API key for the remote data source

## License

MIT
