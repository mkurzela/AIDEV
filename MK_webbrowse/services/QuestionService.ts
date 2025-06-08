import axios from "axios";
import type { IWebPage } from "../types/types";
import { OpenAIService } from "./OpenAIService";
import * as dotenv from "dotenv";
import * as path from "path";

export interface IQuestion {
  id: string;
  text: string;
  answer?: string;
  status: "pending" | "answered" | "failed";
  error?: string;
}

export class QuestionService {
  private questions: IQuestion[] = [];
  private readonly questionsUrl: string;
  private openAIService: OpenAIService;

  constructor(questionsUrl: string, openAIApiKey: string) {
    // Load environment variables from parent directory
    const envPath = path.resolve(process.cwd(), "..", ".env");
    dotenv.config({ path: envPath });

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error(
        `API_KEY not found in environment variables. Tried loading from: ${envPath}`
      );
    }

    // Replace TUTAJ-KLUCZ with the actual API key
    this.questionsUrl = questionsUrl.replace("TUTAJ-KLUCZ", apiKey);
    this.openAIService = new OpenAIService(openAIApiKey);
  }

  async loadQuestions(): Promise<IQuestion[]> {
    try {
      const response = await axios.get(this.questionsUrl);

      if (!Array.isArray(response.data)) {
        throw new Error(
          "Invalid response format: expected an array of questions"
        );
      }

      this.questions = response.data.map((q: any) => ({
        id: q.id || String(Math.random()),
        text: q.text,
        status: "pending",
      }));

      if (this.questions.length === 0) {
        console.warn("No questions loaded from the API");
      }

      return this.questions;
    } catch (error: any) {
      console.error("Error loading questions:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      throw new Error(`Failed to load questions: ${error.message}`);
    }
  }

  async checkForAnswer(
    page: IWebPage,
    question: IQuestion
  ): Promise<{ hasAnswer: boolean; answer?: string }> {
    return this.openAIService.checkForAnswer(page, question.text);
  }

  async selectNextLink(
    page: IWebPage,
    question: IQuestion
  ): Promise<string | null> {
    return this.openAIService.selectNextLink(page, question.text);
  }

  updateQuestionAnswer(id: string, answer: string): void {
    const question = this.questions.find((q) => q.id === id);
    if (question) {
      question.answer = answer;
      question.status = "answered";
    }
  }

  getQuestions(): IQuestion[] {
    return [...this.questions];
  }

  getQuestion(id: string): IQuestion | undefined {
    return this.questions.find((q) => q.id === id);
  }
}
