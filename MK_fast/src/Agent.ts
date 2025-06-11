import { WebService } from "./services/WebService";
import { OpenAIService } from "./services/OpenAIService";
import { KnowledgeBaseService } from "./services/KnowledgeBaseService";
import { Question } from "./types";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, "../../../.env") });

export class Agent {
  private webService: WebService;
  private openAIService: OpenAIService;
  private knowledgeBaseService: KnowledgeBaseService;
  private source1Context: string | null = null;
  private readonly source1ContextPath: string;
  private readonly apiKey: string;

  constructor() {
    this.webService = new WebService();
    this.openAIService = new OpenAIService();
    this.knowledgeBaseService = new KnowledgeBaseService();
    this.source1ContextPath = path.join(__dirname, "../../source1_context.md");

    // Get API key from environment variables
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY not found in environment variables");
    }
    this.apiKey = apiKey;
  }

  async initialize(): Promise<void> {
    await this.knowledgeBaseService.load();
    await this.loadSource1Context();
  }

  private async loadSource1Context(): Promise<void> {
    try {
      // Try to load from local file first
      this.source1Context = await fs.readFile(this.source1ContextPath, "utf-8");
      console.log(
        "Loaded source1 context from local file:",
        this.source1ContextPath
      );
    } catch (error) {
      // If file doesn't exist, we'll download it when needed
      console.log("No local source1 context found, will download when needed");
    }
  }

  private async ensureSource1Context(source1Data: {
    task: string;
  }): Promise<void> {
    if (!this.source1Context) {
      try {
        // Extract context URL from task field - handle the escaped URL properly
        const taskText = source1Data.task;
        console.log("Source1 task text:", taskText);

        // The URL is hardcoded since we know it's always the same
        const contextUrl = "https://centrala.ag3nts.org/dane/arxiv-draft.html";
        console.log("Using context URL:", contextUrl);

        // Use axios instead of fetch for better error handling
        const response = await axios.get(contextUrl);
        const context = response.data;

        // Save to local file for future use
        await fs.writeFile(this.source1ContextPath, context, "utf-8");
        this.source1Context = context;
        console.log("Saved source1 context to:", this.source1ContextPath);
        console.log("Context length:", context.length, "characters");
      } catch (error) {
        console.error("Error handling source1 context:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
        }
        throw error;
      }
    } else {
      console.log("Using existing source1 context");
    }
  }

  async learningPhase(rounds: number): Promise<void> {
    console.log(`Starting learning phase with ${rounds} rounds`);

    for (let round = 1; round <= rounds; round++) {
      console.log(`\nRound ${round}/${rounds}`);
      const startTime = Date.now();

      try {
        // Fetch data from both sources in parallel
        const [source0Data, source1Data] = await Promise.all([
          this.webService.getSource0Data(),
          this.webService.getSource1Data(),
        ]);

        console.log("Source0 data received:", source0Data);
        console.log("Source1 data received:", source1Data);

        // Get answers for source0 questions
        const source0Answers = await this.openAIService.getAnswers(
          source0Data.data
        );
        await this.knowledgeBaseService.addQuestions(source0Answers);
        console.log("Source0 answers added to knowledge base");

        // Handle source1 questions
        await this.ensureSource1Context(source1Data);

        if (!this.source1Context) {
          throw new Error("Failed to load source1 context");
        }

        console.log("Processing source1 questions with context");
        const source1Answers = await this.openAIService.getAnswers(
          source1Data.data,
          this.source1Context
        );
        await this.knowledgeBaseService.addQuestions(source1Answers);
        console.log("Source1 answers added to knowledge base");

        const endTime = Date.now();
        console.log(`Round ${round} completed in ${endTime - startTime}ms`);
        console.log(
          "New questions added:",
          source0Answers.length + source1Answers.length
        );

        // Wait for 30 seconds before next round
        if (round < rounds) {
          console.log("Waiting 30 seconds before next round...");
          await new Promise((resolve) => setTimeout(resolve, 30000));
        }
      } catch (error) {
        console.error(`Error in round ${round}:`, error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
        }
      }
    }
  }

  async answeringPhase(): Promise<void> {
    console.log("Starting answering phase");

    try {
      // Get timestamp and signature
      const { timestamp, signature } = await this.webService.getTimestamp();

      // Fetch questions from both sources in parallel
      const [source0Data, source1Data] = await Promise.all([
        this.webService.getSource0Data(),
        this.webService.getSource1Data(),
      ]);

      console.log("\nReceived questions:");
      console.log("Source0 questions:", source0Data.data);
      console.log("Source1 questions:", source1Data.data);

      // Ensure we have source1 context for answering
      await this.ensureSource1Context(source1Data);

      // Combine all questions
      const allQuestions = [...source0Data.data, ...source1Data.data];
      console.log("\nTotal questions to answer:", allQuestions.length);

      // Find answers in knowledge base
      const answers = await this.knowledgeBaseService.findAnswers(allQuestions);
      console.log(
        "Found answers for",
        answers.size,
        "out of",
        allQuestions.length,
        "questions"
      );

      // If any questions couldn't be answered, switch back to learning
      if (answers.size < allQuestions.length) {
        console.log(
          "Some questions could not be answered. Switching to learning phase..."
        );
        return;
      }

      // Convert answers to the required format
      const formattedAnswers = Array.from(answers.entries()).map(
        ([question, answer]) => ({
          question,
          answer,
        })
      );

      // Prepare answer payload
      const answerPayload = {
        apikey: this.apiKey,
        timestamp,
        signature,
        answer: JSON.stringify(formattedAnswers),
      };

      // Show the payload
      console.log("\nPrepared report payload:");
      console.log("Raw answers:", formattedAnswers);
      console.log("Stringified answer:", answerPayload.answer);
      console.log("Full payload:", JSON.stringify(answerPayload, null, 2));

      // Submit report directly without confirmation
      const response = await this.webService.submitReport(answerPayload);
      console.log("\nReport submission completed");
      if (response.code === 0) {
        console.log("Success! Response:", response.message);
      } else {
        console.log("Error in response:", response);
      }
    } catch (error) {
      console.error("Error in answering phase:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
    }
  }

  cleanup(): void {
    // No need to close readline interface anymore
  }
}
