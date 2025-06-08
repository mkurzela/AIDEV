import * as fs from "fs";
import * as path from "path";
import { OpenAIService } from "./OpenAIService";

export class TextProcessor {
  private readonly polishToLatinMap: { [key: string]: string } = {
    ą: "a",
    ć: "c",
    ę: "e",
    ł: "l",
    ń: "n",
    ó: "o",
    ś: "s",
    ź: "z",
    ż: "z",
    Ą: "A",
    Ć: "C",
    Ę: "E",
    Ł: "L",
    Ń: "N",
    Ó: "O",
    Ś: "S",
    Ź: "Z",
    Ż: "Z",
  };

  private openAIService: OpenAIService;

  constructor() {
    console.log("Initializing TextProcessor...");
    // Ensure the data directory exists
    if (!fs.existsSync("data")) {
      console.log("Creating data directory...");
      fs.mkdirSync("data");
    }
    this.openAIService = new OpenAIService();
    console.log("TextProcessor initialized successfully");
  }

  private normalizeText(text: string): string {
    console.log(`Normalizing text: "${text}"`);
    const normalized = text
      .split("")
      .map((char) => this.polishToLatinMap[char] || char)
      .join("");
    console.log(`Normalized result: "${normalized}"`);
    return normalized;
  }

  async processText(text: string): Promise<void> {
    try {
      console.log("Starting text processing...");
      console.log("Input text length:", text.length);

      // Use OpenAI to extract entities
      console.log("Calling OpenAI service for entity extraction...");
      const { names, places } = await this.openAIService.extractEntities(text);
      console.log("Received entities from OpenAI:", {
        namesCount: names.length,
        placesCount: places.length,
      });

      // Normalize all extracted entities
      console.log("Normalizing extracted entities...");
      const normalizedNames = names.map((name) => this.normalizeText(name));
      const normalizedPlaces = places.map((place) => this.normalizeText(place));

      // Remove duplicates
      console.log("Removing duplicates...");
      const uniqueNames = [...new Set(normalizedNames)];
      const uniquePlaces = [...new Set(normalizedPlaces)];
      console.log("Unique entities:", {
        namesCount: uniqueNames.length,
        placesCount: uniquePlaces.length,
      });

      // Save to files
      console.log("Saving results to files...");
      const peoplePath = path.join("data", "people.txt");
      const placesPath = path.join("data", "places.txt");

      fs.writeFileSync(peoplePath, uniqueNames.join("\n"));
      console.log(`Saved ${uniqueNames.length} names to ${peoplePath}`);

      fs.writeFileSync(placesPath, uniquePlaces.join("\n"));
      console.log(`Saved ${uniquePlaces.length} places to ${placesPath}`);

      console.log("Text processing completed successfully");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error processing text:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("Unknown error processing text:", error);
      }
      throw error;
    }
  }

  getNames(): string[] {
    try {
      console.log("Reading names from file...");
      const names = fs
        .readFileSync(path.join("data", "people.txt"), "utf-8")
        .split("\n")
        .filter((name) => name.trim() !== "");
      console.log(`Read ${names.length} names from file`);
      return names;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error reading names file:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("Unknown error reading names file:", error);
      }
      return [];
    }
  }

  getCities(): string[] {
    try {
      console.log("Reading cities from file...");
      const cities = fs
        .readFileSync(path.join("data", "places.txt"), "utf-8")
        .split("\n")
        .filter((city) => city.trim() !== "");
      console.log(`Read ${cities.length} cities from file`);
      return cities;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error reading cities file:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("Unknown error reading cities file:", error);
      }
      return [];
    }
  }
}
