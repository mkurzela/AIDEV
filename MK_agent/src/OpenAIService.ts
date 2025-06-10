// File: src/OpenAIService.ts
import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIService {
  static async ask(question: string, context: string): Promise<string> {
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful AI agent answering questions based on the given context. Be concise and answer exactly based on the facts. Do not guess.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${question}\n\nAnswer in one word or a short sentence.`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    return completion.choices[0].message.content.trim();
  }
}
