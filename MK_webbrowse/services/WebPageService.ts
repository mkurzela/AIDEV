import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import TurndownService from "turndown";
import * as cheerio from "cheerio";
import type { IWebPage } from "../types/types";
import questions from "../questions.json"; // adjust path as needed

export class WebPageService {
  private turndownService: TurndownService;
  private storageDir: string;

  constructor(storageDir: string) {
    this.turndownService = new TurndownService();
    this.storageDir = storageDir;
  }

  async fetchAndProcessPage(
    url: string,
    parentId?: string,
    depth: number = 0
  ): Promise<IWebPage> {
    try {
      const id = uuidv4();
      const date = new Date().toISOString().split("T")[0];
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });
      const html = response.data;

      // Save debug HTML file for inspection in a dedicated folder
      const debugDir = path.join(process.cwd(), "debug_html");
      await fs.mkdir(debugDir, { recursive: true });
      const debugPath = path.join(debugDir, `debug_${id}.html`);
      await fs.writeFile(debugPath, html, "utf-8");

      // Extract main content or fallback to body
      const $ = cheerio.load(html);
      let mainText = $("main").text().replace(/\s+/g, " ").trim();
      if (!mainText) {
        mainText = $("body").text().replace(/\s+/g, " ").trim();
      }
      console.log("First 500 chars of main content:", mainText.slice(0, 500));

      // Convert HTML to Markdown for storage
      const markdown = this.turndownService.turndown(html);

      // Extract title
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : url;

      // Extract links (improved)
      const links = await this.extractLinks(html, url);

      // Generate storage path and save markdown
      const storagePath = path.join(date, id, "page.md");
      const fullPath = path.join(this.storageDir, storagePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, markdown, "utf-8");

      // Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(mainText, url, questions);

      // Create page object with main content
      const page: IWebPage = {
        id,
        url,
        localPath: storagePath,
        title,
        content: mainText, // Store only main content
        isRoot: !parentId,
        isLeaf: links.length === 0,
        parentId,
        childrenIds: [],
        links,
        relevanceScore,
        metadata: {
          lastVisited: new Date().toISOString(),
          depth,
          status: "processed",
        },
      };

      return page;
    } catch (error: any) {
      console.error("Error processing page:", error);
      return {
        id: uuidv4(),
        url,
        localPath: "",
        title: url,
        content: "",
        isRoot: !parentId,
        isLeaf: true,
        parentId,
        childrenIds: [],
        links: [],
        relevanceScore: 0,
        metadata: {
          lastVisited: new Date().toISOString(),
          depth,
          status: "error",
          error: error.message,
        },
      };
    }
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3); // ignore very short/common words
  }

  calculateRelevanceScore(
    content: string,
    url: string,
    questions: { text: string }[]
  ): number {
    const contentLower = content.toLowerCase();
    const urlLower = url.toLowerCase();
    let totalKeywords = 0;
    let matchedKeywords = 0;

    for (const q of questions) {
      const keywords = this.extractKeywords(q.text);
      totalKeywords += keywords.length;
      for (const word of keywords) {
        if (contentLower.includes(word) || urlLower.includes(word)) {
          matchedKeywords += 1;
        }
      }
    }
    return totalKeywords > 0 ? matchedKeywords / totalKeywords : 0;
  }

  async extractLinks(html: string, baseUrl: string): Promise<string[]> {
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>/g;
    const links: string[] = [];
    let match;
    const baseDomain = new URL(baseUrl).hostname;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      try {
        if (href.startsWith("#") || href.startsWith("javascript:")) continue;
        const absoluteUrl = new URL(href, baseUrl).href;
        const linkDomain = new URL(absoluteUrl).hostname;
        if (baseDomain === linkDomain) {
          links.push(absoluteUrl);
        }
      } catch {
        continue;
      }
    }
    return [...new Set(links)];
  }
}
