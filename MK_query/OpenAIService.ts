import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    this.openai = new OpenAI({ apiKey });
    console.log("OpenAI service initialized successfully");
  }

  async extractEntities(
    text: string
  ): Promise<{ names: string[]; places: string[] }> {
    try {
      console.log("Starting entity extraction from text...");
      console.log("Text length:", text.length);

      const prompt = `Analyze the following Polish text and extract ONLY personal names and place names. 
            Return them in JSON format with two arrays: "names" for personal names and "places" for place names.
            Only include actual names and places, not other words. Use only Latin characters (no Polish diacritics).
            Text to analyze: "${text}"`;

      console.log("Sending request to OpenAI API...");
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a precise entity extraction assistant. Extract only personal names and place names from Polish text. Return them in JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      console.log("Received response from OpenAI API");
      const content = response.choices[0].message.content;
      console.log("Raw API response:", content);

      if (!content) {
        console.warn("Empty response from OpenAI API");
        return { names: [], places: [] };
      }

      const result = JSON.parse(content);
      console.log("Parsed result:", {
        namesCount: result.names?.length || 0,
        placesCount: result.places?.length || 0,
      });

      return {
        names: result.names || [],
        places: result.places || [],
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error in OpenAI service:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("Unknown error in OpenAI service:", error);
      }
      return { names: [], places: [] };
    }
  }
}
