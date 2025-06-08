import OpenAI from "openai";
import type { IWebPage } from "../types/types";
import { answerCheckPrompt } from "../prompts/answerCheck";
import { linkSelectionPrompt } from "../prompts/linkSelection";

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }
    this.openai = new OpenAI({ apiKey });
  }

  async checkForAnswer(
    page: IWebPage,
    question: string
  ): Promise<{ hasAnswer: boolean; answer?: string }> {
    if (!page.content) {
      console.warn("Page has no content to check");
      return { hasAnswer: false };
    }

    try {
      const prompt = answerCheckPrompt
        .replace("{{content}}", page.content)
        .replace("{{question}}", question);

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 150,
      });

      const answer = response.choices[0]?.message?.content?.trim();
      if (!answer || answer === "NO_ANSWER") {
        return { hasAnswer: false };
      }

      return { hasAnswer: true, answer };
    } catch (error) {
      console.error("Error checking for answer:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      return { hasAnswer: false };
    }
  }

  async selectNextLink(
    page: IWebPage,
    question: string
  ): Promise<string | null> {
    if (!page.content || !page.links?.length) {
      console.warn("Page has no content or links to check");
      return null;
    }

    try {
      const prompt = linkSelectionPrompt
        .replace("{{content}}", page.content)
        .replace("{{question}}", question)
        .replace("{{links}}", page.links.join("\n"));

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 50,
      });

      const selectedLink = response.choices[0]?.message?.content?.trim();
      if (!selectedLink || selectedLink === "NO_LINK") {
        return null;
      }

      return selectedLink;
    } catch (error) {
      console.error("Error selecting next link:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      return null;
    }
  }
}
