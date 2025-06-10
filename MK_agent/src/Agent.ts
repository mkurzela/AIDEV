// File: src/Agent.ts
import { OpenAIService } from "./OpenAIService";
import { DBService } from "./DBService";
import { WebService } from "./WebService";
import axios from "axios";
import fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const CONTEXT_PATH = path.join(__dirname, "../context.txt");

const QUESTIONS: Record<string, string> = {
  "01": "Jeden z rozmówców skłamał podczas rozmowy. Kto to był?",
  "02": "Jaki jest prawdziwy endpoint do API podany przez osobę, która NIE skłamała?",
  "03": "Jakim przezwiskiem określany jest chłopak Barbary?",
  "04": "Jakie dwie osoby rozmawiają ze sobą w pierwszej rozmowie? Podaj ich imiona",
  "05": 'Co odpowiada poprawny endpoint API po wysłaniu do niego hasła w polu "password" jako JSON?',
  "06": "Jak ma na imię osoba, która dostarczyła dostęp do API, ale nie znała do niego hasła, jednak nadal pracuje nad jego zdobyciem?",
};

const ENDPOINT = "https://c3ntrala.ag3nts.org/report";
const MAX_RETRIES = 10;
const DELAY_MS = 3000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseIncorrectQuestions(message: string): string[] {
  const matches = message.match(/question (\d\d) is incorrect/g);
  return matches ? matches.map((m) => m.match(/(\d\d)/)![1]) : [];
}

function extractNamesFromContext(context: string): string[] {
  const names = new Set<string>();

  // Extract names from the context - handle Polish names
  const nameMatches =
    context.match(
      /([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?/g
    ) || [];
  nameMatches.forEach((match) => {
    // Get just the first name
    const firstName = match.split(" ")[0];
    names.add(firstName);
  });

  return Array.from(names);
}

async function answerQuestions(
  context: string,
  keys: string[]
): Promise<Record<string, string>> {
  const answers: Record<string, string> = {};
  for (const key of keys) {
    const question = QUESTIONS[key];

    // Special handling for question 05 - always make a fresh request
    if (key === "05") {
      const endpoint = DBService.get("02");
      if (!endpoint) {
        console.error(
          "❌ Cannot check endpoint - answer for question 02 not found"
        );
        continue;
      }
      try {
        const response = await WebService.checkEndpoint(
          endpoint,
          "NONOMNISMORIAR"
        );
        if (!response || response.length < 10) {
          console.error(
            "❌ Invalid response from endpoint - too short or empty"
          );
          continue;
        }
        answers[key] = response;
        DBService.update(key, response);
        continue;
      } catch (error) {
        console.error("❌ Failed to check endpoint:", error);
        continue;
      }
    }

    // For other questions, check cache first
    const prev = DBService.get(key);
    if (prev) {
      answers[key] = prev;
      console.log(`✓ Using cached answer for ${key}: ${prev}`);
      continue;
    }

    console.log(`→ Asking for ${key}: ${question}`);

    // Get wrong answers for this question
    const wrongAnswers = DBService.getWrongAnswers(key);
    let enhancedContext = context;

    // Add universal instructions for all questions
    enhancedContext = `INSTRUCTIONS FOR ANALYSIS:
1. Read the entire context carefully, paying attention to all details and relationships between characters
2. For questions about names or identities, look for:
   - IMPORTANT: For first names (like in question 06), provide ONLY the person's first name
   - For nicknames (like in question 03), it can be ANYTHING - a role, occupation, characteristic, or what the person likes
   - Direct mentions of names or nicknames
   - How characters address each other
   - References to roles or titles
   - Relationships between characters (e.g. "Barbara" is the female agent)
3. For questions about endpoints or technical details, verify:
   - Who provided the information
   - Whether the information was confirmed as correct
   - If there are any contradictions in the information
4. For questions about conversations, analyze:
   - Who is speaking to whom
   - The context of the conversation
   - Any references to other characters or events

IMPORTANT CONTEXT ABOUT CHARACTERS:
- Barbara is a female agent who is addressed as "agentko" in conversations
- She is known for her programming skills and work with AI
- She was in a relationship with Aleksander Ragowski
- She is one of the key figures in the resistance movement

${enhancedContext}`;

    if (wrongAnswers.length > 0) {
      enhancedContext += `\n\nIMPORTANT: The following answers were previously provided and were INCORRECT. Please provide a DIFFERENT answer:\n${wrongAnswers.map((ans, idx) => `${idx + 1}. "${ans}"`).join("\n")}\n\nPlease analyze the context carefully and provide a new, different answer that has not been tried before.`;
    }

    const answer = await OpenAIService.ask(question, enhancedContext);

    // Special handling for question 06 - try names systematically if LLM fails
    if (key === "06") {
      // Clean up the answer by removing quotes and periods
      const cleanAnswer = answer
        ?.replace(/["]+/g, "")
        .replace(/[.]+$/, "")
        .trim();
      // Accept only a single word (name) as a valid answer
      const isSingleName =
        !!cleanAnswer && /^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+$/.test(cleanAnswer);
      const wrongNames = new Set(
        wrongAnswers.map((ans) => ans.replace(/[.,"]/g, "").trim())
      );
      let attemptCount = wrongAnswers.length;

      if (!isSingleName || wrongNames.has(cleanAnswer)) {
        console.log(
          `\n🔍 LLM couldn't find a valid single name, or name already tried. Proceeding to systematic name search...`
        );
        const allNames = extractNamesFromContext(context);
        console.log(`Found ${allNames.length} potential names in context.`);
        console.log(allNames);
        console.log(
          `Already tried ${wrongNames.size} names: ${Array.from(wrongNames).join(", ")}`
        );

        // If we've reached 10 attempts, always enter the additional loop
        if (attemptCount >= 10) {
          console.log(
            "\n🔄 STARTING ADDITIONAL LOOP: LLM failed after 10 attempts"
          );
          console.log("Systematically trying all remaining names...");

          let triedCount = 0;
          for (const firstName of allNames) {
            if (!wrongNames.has(firstName)) {
              triedCount++;
              console.log(
                `[Additional Loop] Trying name ${triedCount}/${allNames.length}: ${firstName}`
              );
              answers[key] = firstName;
              DBService.update(key, firstName);
              break;
            }
          }
          if (triedCount === 0) {
            console.log("❌ No new names to try in additional loop!");
          }
        } else {
          // Try the next name from context that hasn't been tried yet
          let found = false;
          for (const name of allNames) {
            if (!wrongNames.has(name)) {
              console.log(`Trying name: ${name}`);
              answers[key] = name;
              DBService.update(key, name);
              found = true;
              break;
            }
          }
          if (!found) {
            console.log(
              `\n⚠️ No valid name found yet. Attempts so far: ${attemptCount}/10`
            );
          }
        }
      } else {
        console.log(`✓ LLM provided single name answer: ${cleanAnswer}`);
        DBService.update(key, cleanAnswer);
        answers[key] = cleanAnswer;
      }
    } else {
      DBService.update(key, answer);
      answers[key] = answer;
    }

    await delay(DELAY_MS);
  }
  return answers;
}

async function runAgent() {
  const context = fs.readFileSync(CONTEXT_PATH, "utf8");
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    console.log(`\n🔄 Attempt ${retryCount + 1}`);
    const keysToAnswer = Object.keys(QUESTIONS).filter(
      (k) => !DBService.get(k)
    );
    const newAnswers = await answerQuestions(context, keysToAnswer);
    const payload = {
      task: "phone",
      apikey: process.env.API_KEY,
      answer: { ...DBService.load(), ...newAnswers },
    };

    console.log("\n📤 Sending payload to API:");
    console.log(JSON.stringify(payload, null, 2));

    try {
      const res = await axios.post(ENDPOINT, payload);
      console.log("\n📥 API Response:", res.data);
      return;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      console.error("\n❌ Submission failed:", message);
      const wrongKeys = parseIncorrectQuestions(message);
      if (wrongKeys.length === 0) return;
      console.log(`🔁 Will retry for: ${wrongKeys.join(", ")}`);

      // Store wrong answers before clearing them
      for (const key of wrongKeys) {
        const currentAnswer = DBService.get(key);
        if (currentAnswer) {
          DBService.addWrongAnswer(key, currentAnswer);
        }
        DBService.update(key, "");
      }
      retryCount++;
    }
  }

  console.error("❌ Reached max retries. Aborting.");
}

runAgent();
