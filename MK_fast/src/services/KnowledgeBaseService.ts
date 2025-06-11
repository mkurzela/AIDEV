import fs from "fs/promises";
import path from "path";
import { KnowledgeBase, Question } from "../types";

export class KnowledgeBaseService {
  private readonly knowledgeBasePath: string;
  private knowledgeBase: KnowledgeBase;

  constructor() {
    this.knowledgeBasePath = path.join(__dirname, "../../knowledge_base.json");
    this.knowledgeBase = { answers: [] };
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.knowledgeBasePath, "utf-8");
      this.knowledgeBase = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or is invalid, start with empty knowledge base
      this.knowledgeBase = { answers: [] };
      await this.save();
    }
  }

  async save(): Promise<void> {
    await fs.writeFile(
      this.knowledgeBasePath,
      JSON.stringify(this.knowledgeBase, null, 2),
      "utf-8"
    );
  }

  async addQuestions(questions: Question[]): Promise<void> {
    // Add only new questions to avoid duplicates
    for (const question of questions) {
      const exists = this.knowledgeBase.answers.some(
        (q) => q.question === question.question
      );
      if (!exists) {
        this.knowledgeBase.answers.push(question);
      }
    }
    await this.save();
  }

  findAnswer(question: string): string | undefined {
    const found = this.knowledgeBase.answers.find(
      (q) => q.question === question
    );
    return found?.answer;
  }

  async findAnswers(questions: string[]): Promise<Map<string, string>> {
    const answers = new Map<string, string>();

    for (const question of questions) {
      const answer = this.findAnswer(question);
      if (answer) {
        answers.set(question, answer);
      }
    }

    return answers;
  }

  getKnowledgeBase(): KnowledgeBase {
    return this.knowledgeBase;
  }
}
