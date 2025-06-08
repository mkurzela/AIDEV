import axios from "axios";
import * as dotenv from "dotenv";
import * as fs from "fs/promises";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY not found in environment variables");

async function fetchQuestions() {
  const url = `https://c3ntrala.ag3nts.org/data/${API_KEY}/softo.json`;
  console.log("Fetching questions from:", url);
  const response = await axios.get(url);
  const questionsObj = response.data;
  // Convert to array of { id, text }
  const questions = Object.entries(questionsObj).map(([id, text]) => ({
    id,
    text,
  }));
  await fs.writeFile(
    "questions.json",
    JSON.stringify(questions, null, 2),
    "utf-8"
  );
  console.log("Questions saved to questions.json");
}

fetchQuestions();
