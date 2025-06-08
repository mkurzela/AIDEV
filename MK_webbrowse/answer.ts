import { OpenAIService } from "./services/OpenAIService";
import { DatabaseService } from "./services/DatabaseService";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs/promises";

// Load environment variables
const envPath = path.resolve(process.cwd(), "..", ".env");
dotenv.config({ path: envPath });

const API_KEY = process.env.API_KEY as string;
if (!API_KEY) {
  throw new Error("API_KEY not found in environment variables");
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY not found in environment variables");
}

interface Question {
  id: string;
  text: string;
}

interface FinalAnswer {
  task: string;
  apikey: string;
  answer: Record<string, string>;
}

async function answerQuestions() {
  try {
    // Load questions
    const questions: Question[] = JSON.parse(
      await fs.readFile("questions.json", "utf-8")
    );
    console.log(`Loaded ${questions.length} questions.`);

    const openAIService = new OpenAIService(OPENAI_API_KEY);
    const databaseService = await DatabaseService.create("webpages.db");
    const answers: Record<string, string> = {};

    for (const question of questions) {
      console.log(`\nProcessing question ${question.id}: ${question.text}`);

      try {
        const relevantPages = await databaseService.getRelevantPages(
          question.text,
          13
        );
        console.log(`Found ${relevantPages.length} relevant pages to check`);

        let found = false;
        const pagesToCheck =
          relevantPages.length > 0
            ? relevantPages
            : await databaseService.getAllPages();

        for (const page of pagesToCheck) {
          const { hasAnswer, answer } = await openAIService.checkForAnswer(
            page,
            question.text
          );

          if (hasAnswer) {
            console.log(
              `Answer for Q${question.id}: "${answer}"\n  [from: ${page.title} | ${page.url}]`
            );
            answers[question.id] = answer || "";
            found = true;
            break;
          }
        }

        if (!found) {
          console.log(`No answer found for question ${question.id}`);
          answers[question.id] = "";
        }
      } catch (error) {
        console.error(`Error processing question ${question.id}:`, error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
        }
        answers[question.id] = "";
      }
    }

    // Ensure all question IDs are present in the answer object
    for (const question of questions) {
      if (!(question.id in answers)) {
        answers[question.id] = "";
      }
    }

    const finalAnswer: FinalAnswer = {
      task: "softo",
      apikey: API_KEY,
      answer: answers,
    };

    // Log the final answer object
    console.log(
      "Final answers to submit:",
      JSON.stringify(finalAnswer, null, 2)
    );

    // Submit the answer
    console.log("\nSubmitting answers...");
    try {
      const response = await fetch("https://c3ntrala.ag3nts.org/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalAnswer),
      });

      const replyText = await response.text();
      console.log("Reply from external service:", replyText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
    }
  } catch (error) {
    console.error("Fatal error:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    process.exit(1);
  }
}

answerQuestions();
