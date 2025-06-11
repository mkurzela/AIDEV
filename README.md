# AI Agent Development

This repository contains examples and projects related to AI Agent development. Each subfolder represents a different project or example showcasing various aspects of AI agent functionality, including web crawling, map-based webhooks, fine-tuning, and more.

## Projects

### MK_webbrowse

A TypeScript project that implements a web crawling and question answering system. It fetches questions from an external endpoint, crawls web pages (storing them locally and in a database with relevance scoring), and uses OpenAI to generate answers based on the crawled content. See `MK_webbrowse/README.md` for details and usage instructions.

### MK_map_webhook

A Node.js/TypeScript webhook application that simulates drone movement on a 4x4 map using natural language instructions (in English or Polish). It processes movement instructions, determines the drone's final position, and returns the description of the field where it lands. See `MK_map_webhook/README.md` for API and deployment details.

### MK_graph

A TypeScript application for managing and analyzing user connections using a Neo4j graph database and OpenAI embeddings. It fetches data from a remote API, stores it in a Neo4j database, and provides tools for querying relationships and paths between users.

### MK_query

A TypeScript application that helps find a person's current location by analyzing a note and querying various APIs to track their movements. It demonstrates how to use APIs and iterative search processes to locate individuals.

### MK_pics

A TypeScript application for processing and analyzing images using OpenAI's vision capabilities. It demonstrates how to use AI to process, analyze, and extract information from images, including batch processing and caching features.

### MK_finetune

A Python project for fine-tuning GPT models using OpenAI's API. It includes scripts for processing data, running fine-tuning jobs, and validating/reporting results to an external API. See the `MK_finetune/README.md` for details and usage instructions.

### MK_gps

A TypeScript application for GPS tracking, utilizing OpenAI and various APIs to track user locations based on their user IDs or places.

### MK_fast

A fast learning agentic system designed to answer questions by building and maintaining a knowledge base from multiple sources. The system operates in two phases: learning and answering, with a focus on performance and accuracy.

Key features:

- Two-phase operation (learning and answering)
- Parallel processing for better performance
- Persistent knowledge base
- Static context caching
- Automatic error handling
- Performance optimized for sub-6-second response times

[More details](./MK_fast/README.md)

### MK_agent

An agentic system focused on learning and answering questions using a knowledge base. The system is designed to handle multiple sources of information and provide accurate answers in a timely manner.

Key features:

- Learning phase for building knowledge base
- Answering phase for quick responses
- Support for multiple data sources
- Efficient knowledge base management
- Polish language support

[More details](./MK_agent/README.md)

## Getting Started

Each project has its own README with specific setup and usage instructions. Navigate to the respective subfolder for more details.

## Prerequisites

**For TypeScript projects (MK_webbrowse, MK_map_webhook, MK_graph, MK_query, MK_pics):**

- [Bun](https://bun.sh/) (for running and managing the TypeScript projects)
- [Node.js](https://nodejs.org/) (for TypeScript and some dependencies)
- [Neo4j](https://neo4j.com/) (for MK_graph project)
- OpenAI API key (with vision model access for MK_pics, and for MK_webbrowse and MK_map_webhook)
- API key for the remote data source (for MK_webbrowse)

**For Python project (MK_finetune):**

- Python 3.6 or higher
- pip (Python package manager)
- OpenAI API key (with fine-tuning access)
- API key for the external reporting endpoint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
