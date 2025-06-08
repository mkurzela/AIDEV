import sqlite3 from "sqlite3";
import { open } from "sqlite";
import type { IWebPage, IDatabaseService } from "../types/types";

export class DatabaseService implements IDatabaseService {
  private db: any;

  private constructor(db: any) {
    this.db = db;
  }

  static async create(dbPath: string): Promise<DatabaseService> {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS web_pages (
        id TEXT PRIMARY KEY,
        url TEXT UNIQUE,
        localPath TEXT,
        title TEXT,
        content TEXT,
        isRoot BOOLEAN,
        isLeaf BOOLEAN,
        parentId TEXT,
        childrenIds TEXT,
        lastVisited TEXT,
        depth INTEGER,
        status TEXT,
        error TEXT,
        relevance_score REAL DEFAULT 0,
        FOREIGN KEY (parentId) REFERENCES web_pages(id)
      )
    `);

    return new DatabaseService(db);
  }

  async insertPage(page: any) {
    const sql = `
    INSERT OR REPLACE INTO web_pages 
    (id, url, localPath, title, content, isRoot, isLeaf, parentId, childrenIds, lastVisited, depth, status, error, relevance_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    await this.db.run(sql, [
      page.id,
      page.url,
      page.localPath,
      page.title,
      page.content, // <-- This must be the unique content for this page
      page.isRoot ?? false,
      page.isLeaf ?? false,
      page.parentId ?? null,
      page.childrenIds ? JSON.stringify(page.childrenIds) : "[]",
      page.metadata?.lastVisited ?? null,
      page.metadata?.depth ?? 0,
      page.metadata?.status ?? null,
      page.metadata?.error ?? null,
      page.relevanceScore ?? 0,
    ]);
  }

  async getPage(id: string): Promise<IWebPage | null> {
    const page = await this.db.get("SELECT * FROM web_pages WHERE id = ?", [
      id,
    ]);
    if (!page) return null;
    return this.mapToWebPage(page);
  }

  async getPageByUrl(url: string): Promise<IWebPage | null> {
    const page = await this.db.get("SELECT * FROM web_pages WHERE url = ?", [
      url,
    ]);
    if (!page) return null;
    return this.mapToWebPage(page);
  }

  async getPageByLocalPath(localPath: string): Promise<IWebPage | null> {
    const page = await this.db.get(
      "SELECT * FROM web_pages WHERE localPath = ?",
      [localPath]
    );
    if (!page) return null;
    return this.mapToWebPage(page);
  }

  async updatePage(page: IWebPage): Promise<void> {
    await this.insertPage(page); // Using INSERT OR REPLACE
  }

  async getChildren(parentId: string): Promise<IWebPage[]> {
    const pages = await this.db.all(
      "SELECT * FROM web_pages WHERE parentId = ?",
      [parentId]
    );
    return pages.map(this.mapToWebPage);
  }

  async getRootPages(): Promise<IWebPage[]> {
    const pages = await this.db.all("SELECT * FROM web_pages WHERE isRoot = 1");
    return pages.map(this.mapToWebPage);
  }

  async updatePageRelevance(pageId: string, score: number): Promise<void> {
    await this.db.run(`UPDATE web_pages SET relevance_score = ? WHERE id = ?`, [
      score,
      pageId,
    ]);
  }

  public async getRelevantPages(
    question: string,
    limit: number = 10
  ): Promise<IWebPage[]> {
    try {
      const rows = await this.db.all("SELECT * FROM web_pages");
      const pages = rows.map(this.mapToWebPage);
      const scoredPages = pages.map((page: IWebPage) => ({
        ...page,
        relevanceScore: this.calculateRelevanceScore(page, question),
      }));
      scoredPages.sort(
        (a: IWebPage, b: IWebPage) => b.relevanceScore - a.relevanceScore
      );
      return scoredPages.slice(0, limit);
    } catch (error) {
      console.error("Error getting relevant pages:", error);
      return [];
    }
  }

  public calculateRelevanceScore(page: IWebPage, question: string): number {
    const questionWords = question
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2);
    let score = 0;

    // Title match (30% weight)
    const title = page.title.toLowerCase();
    let titleMatches = 0;
    let titleWordCount = 0;
    questionWords.forEach((word) => {
      if (title.includes(word)) {
        titleMatches++;
        // Bonus for exact matches
        if (title.split(/\W+/).includes(word)) {
          titleWordCount++;
        }
      }
    });
    score += (titleMatches / questionWords.length) * 0.2;
    score += (titleWordCount / questionWords.length) * 0.1;

    // Content match (50% weight)
    const content = page.content.toLowerCase();
    let contentMatches = 0;
    let contentWordCount = 0;
    let contentPhraseMatches = 0;

    // Check for individual words
    questionWords.forEach((word) => {
      if (content.includes(word)) {
        contentMatches++;
        // Bonus for exact word matches
        if (content.split(/\W+/).includes(word)) {
          contentWordCount++;
        }
      }
    });

    // Check for phrases (2-3 word combinations)
    for (let i = 0; i < questionWords.length - 1; i++) {
      const phrase = questionWords.slice(i, i + 2).join(" ");
      if (content.includes(phrase)) {
        contentPhraseMatches++;
      }
    }

    score += (contentMatches / questionWords.length) * 0.3;
    score += (contentWordCount / questionWords.length) * 0.1;
    score += (contentPhraseMatches / (questionWords.length - 1)) * 0.1;

    // URL match (20% weight)
    const url = page.url.toLowerCase();
    let urlMatches = 0;
    let urlWordCount = 0;
    questionWords.forEach((word) => {
      if (url.includes(word)) {
        urlMatches++;
        // Bonus for exact matches in URL segments
        if (url.split(/[/-]/).includes(word)) {
          urlWordCount++;
        }
      }
    });
    score += (urlMatches / questionWords.length) * 0.1;
    score += (urlWordCount / questionWords.length) * 0.1;

    // Normalize score between 0 and 1
    const finalScore = Math.min(Math.max(score, 0), 1);
    // console.log(
    // `Score for page [${page.id}] [${page.title}] [${page.url}] for question "${question}": ${finalScore}`
    // );
    return finalScore;
  }

  public async getAllPages(): Promise<IWebPage[]> {
    try {
      const rows = await this.db.all("SELECT * FROM web_pages");
      return rows.map(this.mapToWebPage);
    } catch (error) {
      console.error("Error getting all pages:", error);
      return [];
    }
  }

  private mapToWebPage(row: any): IWebPage {
    return {
      id: row.id,
      url: row.url,
      localPath: row.localPath,
      title: row.title,
      content: row.content,
      isRoot: Boolean(row.isRoot),
      isLeaf: Boolean(row.isLeaf),
      parentId: row.parentId,
      childrenIds: row.childrenIds ? JSON.parse(row.childrenIds) : [],
      relevanceScore:
        row.relevance_score === undefined ? 0 : row.relevance_score,
      metadata: {
        lastVisited: row.lastVisited,
        depth: row.depth,
        status: row.status,
        error: row.error,
      },
    };
  }
}
