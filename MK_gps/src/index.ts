import { GPSAgent } from "./GPSAgent";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env file one level up
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  try {
    console.log("Starting GPS Agent... [OK]");

    // Read user data from file
    const userDataPath = path.join(__dirname, "../usersData.ts");
    const userDataContent = fs.readFileSync(userDataPath, "utf-8");
    const userData = new Map<string, number>();

    // Extract the users array using regex
    const userDataMatch = userDataContent.match(
      /export const users: User\[\] = (\[[\s\S]*?\]);/
    );
    if (!userDataMatch) {
      throw new Error("Invalid user data format");
    }

    // Parse the users array and create a map of username to id
    const users = eval(userDataMatch[1]);
    users.forEach((user: { username: string; id: number }) => {
      userData.set(user.username, user.id);
    });

    console.log("Reading data from file... [OK]");

    // Create GPS agent
    const agent = new GPSAgent(userData);

    // Read input from file (you'll need to implement this based on your requirements)
    const inputPath = path.join(__dirname, "../input.json");
    const input = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

    console.log("Processing input... [OK]");

    // Log the input and userData map for debugging
    console.log("Input:", input);
    console.log("UserData Map:", Object.fromEntries(userData));

    let result: any;

    // Determine if input is a place or username(s)
    if (Array.isArray(input)) {
      // Multiple usernames
      result = await agent.trackUsers(input);
    } else if (typeof input === "string") {
      // Single username or place
      if (userData.has(input)) {
        result = await agent.trackUsers([input]);
      } else {
        result = await agent.trackPlace(input);
      }
    } else {
      throw new Error("Invalid input format");
    }

    // Send report
    const report = await agent.sendReport(result);
    console.log("Report sent successfully:", report);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
