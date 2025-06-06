import { PhotoOrchestrator } from "./PhotoOrchestrator";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const orchestrator = new PhotoOrchestrator();

  try {
    console.log("Starting photo processing workflow...");
    const description = await orchestrator.start();
    console.log("\nFinal description:");
    console.log(description);
  } catch (error) {
    console.error("Error in main process:", error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes("--clear-cache")) {
  const orchestrator = new PhotoOrchestrator();
  orchestrator
    .clearCache()
    .then(() => {
      console.log("Cache cleared successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error clearing cache:", error);
      process.exit(1);
    });
} else {
  main();
}
