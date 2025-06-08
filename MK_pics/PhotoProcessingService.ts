import { OpenAIService } from "./OpenAIService";
import * as fs from "fs/promises";
import * as path from "path";
import * as dotenv from "dotenv";
import {
  PHOTO_ANALYSIS_PROMPTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "./prompts";
import { ChatCompletion } from "openai/resources/chat/completions";

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

interface PhotoProcessingResponse {
  success: boolean;
  message: string;
  newImageUrl?: string;
}

export class PhotoProcessingService {
  private openAIService: OpenAIService;
  private apiKey: string;
  private baseUrl: string;
  private processedImages: Map<string, string> = new Map(); // filename -> processed filename
  private relevantImages: string[] = [];

  constructor() {
    this.openAIService = new OpenAIService();
    this.apiKey = process.env.API_KEY || "";
    this.baseUrl = "https://c3ntrala.ag3nts.org/report";

    if (!this.apiKey) {
      throw new Error("API_KEY is not set in environment variables");
    }
  }

  public async sendCommand(command: string): Promise<PhotoProcessingResponse> {
    console.log("Sending command to API:", command);
    const payload = {
      task: "photos",
      apikey: this.apiKey,
      answer: command,
    };
    console.log("Payload to external endpoint:", payload);
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return {
        success: data.code === "ZERO",
        message: data.message || "",
        newImageUrl: this.extractNewImageUrl(data.message),
      };
    } catch (error) {
      console.error(
        ERROR_MESSAGES.apiError.replace(
          "{error}",
          error instanceof Error ? error.message : "Unknown error"
        )
      );
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private extractNewImageUrl(message: string): string | undefined {
    const match = message.match(/IMG_\d+_FXER\.PNG/i);
    return match ? match[0] : undefined;
  }

  private async assessImageQuality(imagePath: string): Promise<string> {
    try {
      const image = await fs.readFile(imagePath);
      const base64Image = image.toString("base64");

      const response = (await this.openAIService.completion({
        messages: [
          {
            role: "system",
            content: `You are an expert in image quality assessment. Analyze the image and respond with exactly one of these words:
            - REPAIR: if the image has glitches, artifacts, or is broken
            - BRIGHTEN: if the image is too dark
            - DARKEN: if the image is too bright
            - GOOD: if the image quality is acceptable
            - SKIP: if the image shows a person from behind or is otherwise unusable for facial analysis
            
            Respond with exactly one word, no additional text.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and determine if it needs fixing:",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
              },
            ],
          },
        ],
        model: "gpt-4o",
        stream: false,
      })) as ChatCompletion;

      const result = response.choices[0].message.content?.trim().toUpperCase();
      return result || "GOOD";
    } catch (error) {
      console.error("Error assessing image quality:", error);
      return "GOOD";
    }
  }

  public async checkPhotoRelevance(imageUrl: string): Promise<boolean> {
    if (this.relevantImages.length === 0) {
      return true; // First image is always relevant
    }

    try {
      const response = (await this.openAIService.completion({
        messages: [
          {
            role: "system",
            content: PHOTO_ANALYSIS_PROMPTS.photoRelevance.system,
          },
          {
            role: "user",
            content: PHOTO_ANALYSIS_PROMPTS.photoRelevance.user.replace(
              "{imageUrl}",
              imageUrl
            ),
          },
        ],
        model: "gpt-4o",
        stream: false,
      })) as ChatCompletion;

      const result = response.choices[0].message.content?.trim().toUpperCase();
      return result === "SAME_PERSON";
    } catch (error) {
      console.error(
        ERROR_MESSAGES.processingError.replace(
          "{error}",
          error instanceof Error ? error.message : "Unknown error"
        )
      );
      return false;
    }
  }

  private async trackFixedImage(
    originalFilename: string,
    fixedFilename: string
  ): Promise<void> {
    const fixedImagesFile = path.join(__dirname, "cache", "fixed_images.json");
    let fixedImages: Record<string, string> = {};

    try {
      const data = await fs.readFile(fixedImagesFile, "utf-8");
      fixedImages = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, that's okay
    }

    fixedImages[originalFilename] = fixedFilename;
    await fs.writeFile(fixedImagesFile, JSON.stringify(fixedImages, null, 2));
  }

  private async getFixedImageInfo(
    originalFilename: string
  ): Promise<{ path: string; quality: string } | null> {
    const fixedImagesFile = path.join(__dirname, "cache", "fixed_images.json");
    try {
      const data = await fs.readFile(fixedImagesFile, "utf-8");
      const fixedImages: Record<string, string> = JSON.parse(data);

      if (fixedImages[originalFilename]) {
        const fixedPath = path.join(
          __dirname,
          "cache",
          fixedImages[originalFilename]
        );
        try {
          await fs.access(fixedPath);
          const quality = await this.assessImageQuality(fixedPath);
          return { path: fixedPath, quality };
        } catch {
          // File doesn't exist, remove from tracking
          delete fixedImages[originalFilename];
          await fs.writeFile(
            fixedImagesFile,
            JSON.stringify(fixedImages, null, 2)
          );
        }
      }
    } catch (error) {
      // File doesn't exist or other error, that's okay
    }
    return null;
  }

  public async processImage(imagePath: string): Promise<string> {
    try {
      const filename = path.basename(imagePath);

      // First assess the image quality
      const quality = await this.assessImageQuality(imagePath);
      console.log(`Image ${imagePath} quality assessment: ${quality}`);

      if (quality === "SKIP") {
        console.log(
          `Skipping image ${imagePath} as it shows person from behind`
        );
        return imagePath;
      }

      if (quality === "GOOD") {
        console.log(`Image ${imagePath} is already in good quality`);
        return imagePath;
      }

      let currentPath = imagePath;
      let attempts = 0;
      const maxAttempts = 3;
      let currentQuality = quality;

      while (attempts < maxAttempts) {
        attempts++;
        console.log(`Processing attempt ${attempts} for ${currentPath}`);

        // Apply the appropriate fix based on current quality assessment
        const command = `${currentQuality} ${path.basename(currentPath)}`;
        console.log(`Sending command to API: ${command}`);
        const response = await this.sendCommand(command);

        // Extract the fixed image filename from the response
        const fixedImageMatch = response.message.match(
          /IMG_\d+_[A-Z0-9]+\.PNG/i
        );
        if (!fixedImageMatch) {
          throw new Error(
            `No fixed image filename found in response: ${response.message}`
          );
        }

        const fixedFilename = fixedImageMatch[0];
        console.log(`Found fixed image filename in response: ${fixedFilename}`);

        // Download the fixed image from the correct base URL
        const fixedImageUrl = `https://centrala.ag3nts.org/dane/barbara/${fixedFilename}`;
        console.log(`Downloading fixed image from ${fixedImageUrl}`);

        const cacheDir = path.join(__dirname, "cache");
        await fs.mkdir(cacheDir, { recursive: true });
        const fixedImagePath = path.join(cacheDir, fixedFilename);

        const imageResponse = await fetch(fixedImageUrl);
        if (!imageResponse.ok) {
          throw new Error(
            `Failed to download fixed image: ${imageResponse.statusText}`
          );
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        await fs.writeFile(fixedImagePath, Buffer.from(imageBuffer));
        console.log(`Successfully downloaded fixed image to ${fixedImagePath}`);

        // Track the fixed image
        await this.trackFixedImage(path.basename(currentPath), fixedFilename);

        // Check quality of the fixed image
        currentQuality = await this.assessImageQuality(fixedImagePath);
        console.log(
          `Fixed image ${fixedFilename} quality assessment: ${currentQuality}`
        );

        if (currentQuality === "GOOD") {
          console.log(`Fixed image ${fixedFilename} is now in good quality`);
          return fixedImagePath;
        }

        if (currentQuality === "SKIP") {
          console.log(
            `Fixed image ${fixedFilename} shows person from behind, skipping`
          );
          return fixedImagePath;
        }

        // If still not good, continue with the next attempt using the new quality assessment
        currentPath = fixedImagePath;
      }

      console.log(`Reached maximum attempts (${maxAttempts}) for ${imagePath}`);
      return currentPath;
    } catch (error) {
      console.error(`Error processing image ${imagePath}:`, error);
      throw error;
    }
  }

  private async imageToBase64(imagePath: string): Promise<string> {
    const buffer = await fs.readFile(imagePath);
    return buffer.toString("base64");
  }

  public async generateDescription(imagePaths: string[]): Promise<string> {
    try {
      console.log("Generating description for images:", imagePaths);

      // Filter out images that are not in good quality
      const goodQualityImages = [];
      for (const imagePath of imagePaths) {
        const quality = await this.assessImageQuality(imagePath);
        if (quality === "GOOD") {
          goodQualityImages.push(imagePath);
        } else {
          console.log(
            `Skipping ${imagePath} for description as it's not in good quality (${quality})`
          );
        }
      }

      if (goodQualityImages.length === 0) {
        return "Nie udało się wygenerować opisu - brak zdjęć w dobrej jakości.";
      }

      const descriptions: string[] = [];
      for (const imagePath of goodQualityImages) {
        const base64Image = await this.imageToBase64(imagePath);

        const response = (await this.openAIService.completion({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "Jesteś analitykiem zdjęć. Skup się na opisaniu głównego obiektu (Barbara) w jasny i zwięzły sposób. Uwzględnij kluczowe szczegóły dotyczące jej wyglądu, wyrazu twarzy i postawy. Zachowaj zwięzłość, ale zachowaj informacyjność.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Opisz Barbarę na tym zdjęciu, skupiając się na jej wyglądzie i postawie.",
                },
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                },
              ],
            },
          ],
          maxTokens: 150,
        })) as ChatCompletion;

        const description = response.choices[0]?.message?.content;
        if (description) {
          descriptions.push(description);
        }
      }

      // Combine descriptions into a concise summary
      const summaryResponse = (await this.openAIService.completion({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Jesteś analitykiem zdjęć. Stwórz zwięzłe podsumowanie wyglądu Barbary na podstawie wielu zdjęć. Skup się na najważniejszych szczegółach i zachowaj profesjonalny ton.",
          },
          {
            role: "user",
            content: `Stwórz zwięzłe podsumowanie wyglądu Barbary na podstawie tych opisów:\n${descriptions.join("\n")}`,
          },
        ],
        maxTokens: 200,
      })) as ChatCompletion;

      return (
        summaryResponse.choices[0]?.message?.content ||
        "Nie udało się wygenerować opisu."
      );
    } catch (error) {
      console.error("Error generating description:", error);
      throw error;
    }
  }

  public async startProcessing(): Promise<string> {
    try {
      // Start the conversation
      const startResponse = await this.sendCommand("START");
      if (!startResponse.success) {
        throw new Error(
          ERROR_MESSAGES.apiError.replace("{error}", startResponse.message)
        );
      }

      // Extract image filenames from the response
      const imageFilenames = this.extractImageFilenames(startResponse.message);
      const processedImages: string[] = [];

      // Process each image
      for (const filename of imageFilenames) {
        let currentImage = filename;
        let attempts = 0;
        const maxAttempts = 3;

        // Try to fix the image up to maxAttempts times
        while (attempts < maxAttempts) {
          const quality = await this.assessImageQuality(currentImage);

          if (quality === "SKIP") {
            console.log(
              `Skipping image ${currentImage} as it's not suitable for analysis`
            );
            break;
          }

          if (quality === "GOOD") {
            console.log(`Image ${currentImage} is now in good quality`);
            processedImages.push(currentImage);
            break;
          }

          currentImage = await this.processImage(currentImage);
          attempts++;
        }

        if (attempts >= maxAttempts) {
          console.log(
            `Max attempts reached for image ${filename}, using last processed version`
          );
          processedImages.push(currentImage);
        }
      }

      if (processedImages.length === 0) {
        throw new Error("No suitable images found for analysis");
      }

      // Generate the final description using only good quality images
      const description = await this.generateDescription(processedImages);

      // Send the final description
      const finalResponse = await this.sendCommand(description);
      if (!finalResponse.success) {
        throw new Error(
          ERROR_MESSAGES.apiError.replace("{error}", finalResponse.message)
        );
      }

      console.log(SUCCESS_MESSAGES.descriptionGenerated);
      return description;
    } catch (error) {
      console.error(
        ERROR_MESSAGES.processingError.replace(
          "{error}",
          error instanceof Error ? error.message : "Unknown error"
        )
      );
      throw error;
    }
  }

  private extractImageFilenames(message: string): string[] {
    const matches = message.match(/IMG_\d+\.PNG/gi) || [];
    return matches.map((filename) => filename.toLowerCase());
  }
}
