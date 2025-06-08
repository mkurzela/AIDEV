import { WebPageService } from "./services/WebPageService";
import { DatabaseService } from "./services/DatabaseService";
import * as path from "path";
import * as fs from "fs/promises";

async function crawlSite() {
  const storageDir = `${process.cwd()}/storage`;
  await fs.mkdir(storageDir, { recursive: true });
  const webPageService = new WebPageService(storageDir);
  const databaseService = await DatabaseService.create("webpages.db");

  const startUrl = "https://softo.ag3nts.org/";
  const visited = new Set<string>();
  const queue: { url: string; parentId?: string; depth: number }[] = [
    { url: startUrl, parentId: undefined, depth: 0 },
  ];
  const maxDepth = 10;

  while (queue.length > 0) {
    const { url, parentId, depth } = queue.shift()!;
    if (visited.has(url) || depth > maxDepth) continue;
    visited.add(url);
    console.log(`Crawling: ${url}`);
    let page = await databaseService.getPageByUrl(url);
    if (!page) {
      page = await webPageService.fetchAndProcessPage(url, parentId, depth);
      // Debug: Log content and score
      console.log(`Page content length: ${page.content?.length}`);
      console.log(`First 100 chars of content: ${page.content?.slice(0, 100)}`);
      console.log(`Page relevanceScore: ${page.relevanceScore}`); // <-- fix here
      await databaseService.insertPage(page);
      console.log(`Stored: ${page.localPath}`);
    }
    // Find links in the page
    const links = page.links || [];
    for (const link of links) {
      if (!visited.has(link)) {
        queue.push({ url: link, parentId: page.id, depth: depth + 1 });
      }
    }
  }
  console.log("Crawling complete.");
}

crawlSite();

// Removed invalid standalone async function definition.
// If you need this function, define it inside a class or as a standalone exported function in a separate file.
