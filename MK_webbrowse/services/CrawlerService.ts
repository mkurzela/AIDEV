import { WebPageService } from "./WebPageService";
import { QuestionService, IQuestion } from "./QuestionService";
import { DatabaseService } from "./DatabaseService";
import type { IWebPage } from "../types/types";

export class CrawlerService {
  private webPageService: WebPageService;
  private questionService: QuestionService;
  private databaseService: DatabaseService;
  private maxDepth: number;
  private visitedUrls: Set<string>;

  constructor(
    webPageService: WebPageService,
    questionService: QuestionService,
    databaseService: DatabaseService,
    maxDepth: number = 3
  ) {
    this.webPageService = webPageService;
    this.questionService = questionService;
    this.databaseService = databaseService;
    this.maxDepth = maxDepth;
    this.visitedUrls = new Set();
  }

  async startCrawling(startUrl: string): Promise<void> {
    try {
      // Load questions
      const questions = await this.questionService.loadQuestions();

      // Process each question
      for (const question of questions) {
        await this.processQuestion(startUrl, question);
      }
    } catch (error: any) {
      console.error("Error in crawling process:", error);
      throw error;
    }
  }

  private async processQuestion(
    startUrl: string,
    question: IQuestion
  ): Promise<void> {
    let currentUrl = startUrl;
    let depth = 0;

    while (depth < this.maxDepth) {
      // Skip if we've already visited this URL
      if (this.visitedUrls.has(currentUrl)) {
        break;
      }
      this.visitedUrls.add(currentUrl);

      // Get or fetch the page
      let page = await this.databaseService.getPageByUrl(currentUrl);
      if (!page) {
        page = await this.webPageService.fetchAndProcessPage(currentUrl);
        await this.databaseService.insertPage(page);
      }

      // Check if this page has the answer
      const { hasAnswer, answer } = await this.questionService.checkForAnswer(
        page,
        question
      );
      if (hasAnswer && answer) {
        this.questionService.updateQuestionAnswer(question.id, answer);
        return;
      }

      // If no answer, select next link to follow
      const nextUrl = await this.questionService.selectNextLink(page, question);
      if (!nextUrl) {
        break;
      }

      currentUrl = nextUrl;
      depth++;
    }

    // If we've reached max depth without finding an answer
    if (depth >= this.maxDepth) {
      const currentQuestion = this.questionService.getQuestion(question.id);
      if (currentQuestion) {
        currentQuestion.status = "failed";
        currentQuestion.error = "Maximum depth reached without finding answer";
      }
    }
  }

  reset(): void {
    this.visitedUrls.clear();
  }
}
