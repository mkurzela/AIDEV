import OpenAI from "openai";
import { Question } from "../types";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env file one level up
dotenv.config({ path: path.join(__dirname, "../../../.env") });

export class OpenAIService {
  private openai: OpenAI;
  private model: string = "gpt-3.5-turbo"; // Using a faster model for better performance

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getAnswer(question: string, context?: string): Promise<string> {
    try {
      const prompt = context
        ? `Context: ${context}\nQuestion: ${question}\nAnswer in Polish:`
        : `Question: ${question}\nAnswer in Polish:`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that provides concise answers in Polish.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 100, // Limiting response length for faster generation
        temperature: 0.3, // Lower temperature for more focused answers
      });

      return response.choices[0].message.content?.trim() || "";
    } catch (error) {
      console.error("Error getting answer from OpenAI:", error);
      throw error;
    }
  }

  async getAnswers(questions: string[], context?: string): Promise<Question[]> {
    const answers: Question[] = [];

    // Process questions in parallel for better performance
    const answerPromises = questions.map(async (question) => {
      const answer = await this.getAnswer(question, context);
      return { question, answer };
    });

    return Promise.all(answerPromises);
  }
}
