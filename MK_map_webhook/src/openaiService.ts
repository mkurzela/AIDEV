import dotenv from "dotenv";
// Explicitly specify the path to the .env file in the parent directory
dotenv.config({ path: "../.env" });

import { OpenAI } from "openai";
// Prepare your OpenAI API key in .env as OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Main function to get field description
export async function getFieldDescription(
  instruction: string,
  map: string[][]
): Promise<string> {
  // If instruction is empty, return starting point
  if (!instruction.trim()) return map[0][0];

  try {
    const prompt = `You are a drone movement interpreter. Given a 4x4 map and a natural language instruction, determine the final position (row, col) where the drone lands.

Rules:
1. The drone always starts at position (0,0)
2. The map is 4x4 (rows and columns are numbered 0-3)
3. When no specific distance is mentioned, assume one step
4. "All the way", "na maksa", "na sam", "ile tylko możemy" means to the edge of the map (0 or 3)
5. "o X pola" means exactly X steps
6. If there's hesitation or thinking in the instruction, use the last clear movement instruction
7. Movements are processed sequentially in the order they appear
8. Corrections ("korekta") are applied after the main movement
9. The map is represented as a 2D array where each cell contains a description in Polish
10. The instruction can be in either English or Polish

Example instructions and their results:
- "poleciałem jedno pole w prawo" -> {"row": 0, "col": 1}
- "na maksa w prawo" -> {"row": 0, "col": 3}
- "o dwa pola w prawo" -> {"row": 0, "col": 2}
- "na sam dół, a później o dwa pola w prawo" -> {"row": 3, "col": 2}
- "Lecimy w dół, albo nie! nie! czekaaaaj. W prawo i dopiero teraz w dół" -> {"row": 1, "col": 1}
- "Idziemy na sam dół mapy. Albo nie! nie! nie idziemy. W prawo maksymalnie" -> {"row": 0, "col": 3}
- "na sam dół, ile tylko możemy w prawo, korekta o jedno pole do góry" -> {"row": 2, "col": 3}
- "na sam dół, a później o dwa pola w prawo" -> {"row": 3, "col": 2}

Map:
${JSON.stringify(map, null, 2)}

Instruction: "${instruction}"

Return ONLY a JSON object with the final position in this format:
{
  "row": number (0-3),
  "col": number (0-3)
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0,
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error("No response from OpenAI");

    const position = JSON.parse(response);

    // Validate position is within bounds
    if (
      position.row < 0 ||
      position.row > 3 ||
      position.col < 0 ||
      position.col > 3
    ) {
      throw new Error("Position out of bounds");
    }

    // Return the map field at the calculated position
    return map[position.row][position.col];
  } catch (error) {
    console.error("Error processing instruction:", error);
    return "błąd serwera";
  }
}
