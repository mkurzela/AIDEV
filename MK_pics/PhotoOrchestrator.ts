import { PhotoProcessingService } from "./PhotoProcessingService";
import * as fs from "fs/promises";
import * as path from "path";

interface PhotoState {
  originalFilename: string;
  currentFilename: string;
  processedVersions: string[];
  isRelevant: boolean | undefined;
  isProcessed: boolean;
  lastOperation?: string;
  lastError?: string;
  originalUrl?: string;
}

interface Checkpoint {
  timestamp: string;
  photos: PhotoState[];
  description?: string;
  isComplete: boolean;
}

export class PhotoOrchestrator {
  private photoService: PhotoProcessingService;
  private cacheDir: string;
  private checkpointFile: string;
  private currentCheckpoint: Checkpoint | null = null;
  private readonly baseImageUrl = "https://centrala.ag3nts.org/dane/barbara/";

  constructor() {
    this.photoService = new PhotoProcessingService();
    this.cacheDir = path.join(__dirname, "cache");
    this.checkpointFile = path.join(this.cacheDir, "checkpoint.json");
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error("Error creating cache directory:", error);
      throw error;
    }
  }

  private async loadCheckpoint(): Promise<Checkpoint | null> {
    try {
      const data = await fs.readFile(this.checkpointFile, "utf-8");
      return JSON.parse(data) as Checkpoint;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      console.error("Error loading checkpoint:", error);
      throw error;
    }
  }

  private async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    try {
      await fs.writeFile(
        this.checkpointFile,
        JSON.stringify(checkpoint, null, 2)
      );
    } catch (error) {
      console.error("Error saving checkpoint:", error);
      throw error;
    }
  }

  private async downloadImage(
    imageUrl: string,
    filename: string
  ): Promise<string> {
    const localPath = path.join(this.cacheDir, filename);

    try {
      // Check if file already exists in cache
      try {
        await fs.access(localPath);
        console.log(
          `Image ${filename} already exists in cache at ${localPath}`
        );
        return localPath;
      } catch {
        // File doesn't exist, proceed with download
      }

      console.log(`Downloading image from ${imageUrl} to ${localPath}`);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      await fs.writeFile(localPath, Buffer.from(buffer));
      console.log(
        `Successfully downloaded and stored ${filename} at ${localPath}`
      );
      return localPath;
    } catch (error) {
      console.error(`Error downloading image ${filename}:`, error);
      throw error;
    }
  }

  private async processPhoto(photo: PhotoState): Promise<PhotoState> {
    if (photo.isProcessed) {
      return photo;
    }

    try {
      console.log(`Processing photo ${photo.originalFilename}`);
      const processedPath = await this.photoService.processImage(
        photo.currentFilename
      );

      if (processedPath === photo.currentFilename) {
        console.log(
          `Photo ${photo.originalFilename} is already in good quality`
        );
        photo.isProcessed = true;
        photo.lastOperation = "GOOD";
        return photo;
      }

      // We got a fixed image, analyze it
      photo.processedVersions.push(processedPath);
      photo.currentFilename = processedPath;
      photo.lastOperation = "PROCESSED";

      // Check if the fixed image is good quality
      const isGood = await this.photoService.checkPhotoRelevance(processedPath);
      if (isGood) {
        console.log(`Fixed image ${processedPath} is in good quality`);
        photo.isProcessed = true;
      } else {
        console.log(`Fixed image ${processedPath} still needs improvement`);
        photo.lastOperation = "NEEDS_IMPROVEMENT";
      }
    } catch (error) {
      photo.lastError =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Error processing photo ${photo.originalFilename}:`, error);
    }

    return photo;
  }

  private async checkPhotoRelevance(photo: PhotoState): Promise<PhotoState> {
    if (photo.isRelevant !== undefined) {
      return photo;
    }

    try {
      const isRelevant = await this.photoService.checkPhotoRelevance(
        photo.currentFilename
      );
      photo.isRelevant = isRelevant;
    } catch (error) {
      photo.lastError =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Error checking photo relevance ${photo.originalFilename}:`,
        error
      );
    }

    return photo;
  }

  private async createInitialCheckpoint(
    photos: PhotoState[]
  ): Promise<Checkpoint> {
    return {
      timestamp: new Date().toISOString(),
      photos,
      isComplete: false,
    };
  }

  private async updateCheckpoint(
    photos: PhotoState[],
    description?: string
  ): Promise<void> {
    const checkpoint: Checkpoint = {
      timestamp: new Date().toISOString(),
      photos,
      description,
      isComplete: description !== undefined,
    };

    await this.saveCheckpoint(checkpoint);
    this.currentCheckpoint = checkpoint;
  }

  private async extractPhotosFromResponse(
    response: string
  ): Promise<PhotoState[]> {
    const photoFilenames = response.match(/IMG_\d+\.PNG/gi) || [];
    const photos: PhotoState[] = [];

    for (const filename of photoFilenames) {
      const imageUrl = `${this.baseImageUrl}${filename}`;
      const localPath = await this.downloadImage(imageUrl, filename);

      photos.push({
        originalFilename: filename,
        currentFilename: localPath,
        processedVersions: [],
        isRelevant: undefined,
        isProcessed: false,
        originalUrl: imageUrl,
      });
    }

    return photos;
  }

  public async start(): Promise<string> {
    try {
      await this.ensureCacheDirectory();

      // Try to load existing checkpoint
      this.currentCheckpoint = await this.loadCheckpoint();

      if (this.currentCheckpoint?.isComplete) {
        console.log(
          "Found completed checkpoint. Returning cached description."
        );
        return this.currentCheckpoint.description!;
      }

      // Start new session or continue from checkpoint
      const startResponse = await this.photoService.sendCommand("START");

      // Check if response contains image URLs
      if (
        startResponse.message.includes(
          "https://centrala.ag3nts.org/dane/barbara/"
        )
      ) {
        console.log("Received image URLs from API:", startResponse.message);
      } else if (!startResponse.success) {
        throw new Error(
          `Failed to start photo processing: ${startResponse.message}`
        );
      }

      // Initialize or update photos from checkpoint
      let photos: PhotoState[];
      if (this.currentCheckpoint) {
        photos = this.currentCheckpoint.photos;
        console.log("Continuing from checkpoint with", photos.length, "photos");
      } else {
        photos = await this.extractPhotosFromResponse(startResponse.message);
        await this.updateCheckpoint(photos);
      }

      // Process each photo
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        // Skip if already processed
        if (photo.isProcessed) {
          continue;
        }

        // Process photo
        photos[i] = await this.processPhoto(photo);
        await this.updateCheckpoint(photos);

        // Check relevance
        photos[i] = await this.checkPhotoRelevance(photo);
        await this.updateCheckpoint(photos);
      }

      // Filter relevant photos
      const relevantPhotos = photos.filter((p) => p.isRelevant);

      if (relevantPhotos.length === 0) {
        throw new Error("No relevant photos found");
      }

      // Generate description
      const description = await this.photoService.generateDescription(
        relevantPhotos.map((p) => p.currentFilename)
      );

      // Save final checkpoint
      await this.updateCheckpoint(photos, description);

      // Send description to API
      const finalResponse = await this.photoService.sendCommand(description);
      if (!finalResponse.success) {
        throw new Error(
          `Failed to send final description: ${finalResponse.message}`
        );
      }

      return description;
    } catch (error) {
      console.error("Error in photo processing workflow:", error);
      throw error;
    }
  }

  public async clearCache(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await this.ensureCacheDirectory();
      this.currentCheckpoint = null;
    } catch (error) {
      console.error("Error clearing cache:", error);
      throw error;
    }
  }
}
