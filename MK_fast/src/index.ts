import { Agent } from "./Agent";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const agent = new Agent();
  await agent.initialize();

  try {
    while (true) {
      console.log("\nChoose an option:");
      console.log("1. Continue learning phase");
      console.log("2. Start answering phase");
      console.log("3. Exit");

      const answer = await new Promise<string>((resolve) => {
        rl.question("Enter your choice (1-3): ", resolve);
      });

      switch (answer.trim()) {
        case "1":
          const rounds = await new Promise<number>((resolve) => {
            rl.question("Enter number of learning rounds: ", (input) => {
              resolve(parseInt(input.trim(), 10));
            });
          });
          await agent.learningPhase(rounds);
          break;

        case "2":
          await agent.answeringPhase();
          break;

        case "3":
          console.log("Exiting...");
          agent.cleanup();
          rl.close();
          process.exit(0);

        default:
          console.log("Invalid choice. Please try again.");
      }
    }
  } catch (error) {
    console.error("Fatal error:", error);
    agent.cleanup();
    rl.close();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
