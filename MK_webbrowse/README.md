# Web Crawler and Question Answering System

This project implements a web crawling and question answering system that fetches questions from an external endpoint, crawls web pages, and generates answers based on the crawled content.

## Project Structure

```
MK_webbrowse/
├── services/
│   ├── CrawlerService.ts    # Handles web page crawling and processing
│   ├── DatabaseService.ts   # Manages SQLite database operations
│   ├── OpenAIService.ts     # Handles OpenAI API interactions
│   └── WebPageService.ts    # Manages web page fetching and storage
├── storage/                 # Directory for storing crawled web pages
├── fetch_questions.ts       # Fetches questions from external endpoint
├── crawl.ts                # Main crawling script
├── answer.ts               # Generates answers to questions
└── webpages.db             # SQLite database for storing page metadata
```

## Prerequisites

- Node.js and Bun runtime
- API keys (stored in `.env` file in parent directory):
  - `API_KEY`: For accessing the question endpoint
  - `OPENAI_API_KEY`: For OpenAI API access

## Installation

1. Clone the repository
2. Install dependencies:

```bash
bun install
```

3. Create a `.env` file in the parent directory with required API keys:

```
API_KEY=your_api_key
OPENAI_API_KEY=your_openai_api_key
```

## Usage

The project consists of three main steps that should be executed in sequence:

1. **Fetch Questions**

```bash
bun fetch_questions.ts
```

This script fetches questions from the external endpoint and saves them to `questions.json`.

2. **Crawl Web Pages**

```bash
bun crawl.ts
```

This script:

- Starts crawling from the specified URL
- Crawls parent and sub-URLs up to a maximum depth
- Stores web pages locally in the `storage` directory
- Saves metadata and relevance scores in `webpages.db`
- Calculates relevance scores for each page

3. **Generate Answers**

```bash
bun answer.ts
```

This script:

- Loads questions from `questions.json`
- Searches through crawled pages for relevant content
- Uses OpenAI to generate answers
- Submits answers to the external endpoint

## Features

- **Intelligent Crawling**: The system crawls web pages with depth control and duplicate prevention
- **Relevance Scoring**: Pages are scored based on their relevance to potential questions
- **Local Storage**: Web pages are stored locally for efficient access
- **Database Management**: Metadata is stored in SQLite for quick retrieval
- **OpenAI Integration**: Uses OpenAI's API for intelligent answer generation
- **Error Handling**: Robust error handling throughout the process

## Database Schema

The `webpages.db` SQLite database stores:

- Page metadata (URL, title, content)
- Crawling information (depth, parent page)
- Relevance scores for question matching

## Notes

- The system implements a maximum crawl depth to prevent infinite crawling
- Pages are scored for relevance to optimize answer generation
- The system handles API errors and network issues gracefully
- All crawled content is stored locally for future use
