import axios from "axios";
import {
  UserData,
  GPSLocation,
  GPSResponse,
  PlaceData,
  APIResponse,
} from "./types";
import { remove as removeDiacritics } from "diacritics";
import readline from "readline";

export class GPSAgent {
  private readonly baseUrl = "https://c3ntrala.ag3nts.org";
  private readonly userData: Map<string, number>;
  private readonly apiKey: string;

  constructor(userData: Map<string, number>, apiKey: string) {
    this.userData = userData;
    this.apiKey = apiKey;
  }

  private async getGPSLocation(userId: number): Promise<GPSLocation> {
    try {
      const response = await axios.post(`${this.baseUrl}/gps`, {
        apikey: process.env.API_KEY,
        userID: userId.toString(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting GPS location for user ${userId}:`, error);
      throw error;
    }
  }

  private async getPlaceData(placeName: string): Promise<PlaceData | null> {
    try {
      const response = await axios.post(`${this.baseUrl}/places`, {
        apikey: process.env.API_KEY,
        query: placeName.toUpperCase(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting place data for ${placeName}:`, error);
      return null;
    }
  }

  // Helper to map uppercase names to userData keys
  private mapToUserDataKeys(names: string[]): string[] {
    const userDataKeys = Array.from(this.userData.keys());
    return names.map((name) => {
      // Remove diacritics and compare case-insensitively
      const normalizedName = removeDiacritics(name).toLowerCase();
      const match = userDataKeys.find(
        (key) => removeDiacritics(key).toLowerCase() === normalizedName
      );
      return match || name;
    });
  }

  public async trackUsers(usernames: string[]): Promise<GPSResponse> {
    const result: GPSResponse = {};

    for (const username of usernames) {
      const userId = this.userData.get(username);
      if (!userId) {
        console.warn(`User ${username} not found in database`);
        continue;
      }

      try {
        const location = await this.getGPSLocation(userId);
        result[username] = location;
      } catch (error) {
        console.error(`Failed to get GPS location for ${username}`);
      }
    }

    return result;
  }

  public async trackPlace(placeName: string): Promise<GPSResponse> {
    const placeData = await this.getPlaceData(placeName);
    if (!placeData) {
      throw new Error(`Place ${placeName} not found`);
    }

    // Log placeData for debugging
    console.log("Place Data:", placeData);

    // Parse the message to extract usernames and filter out BARBARA
    const rawUsernames =
      placeData.message
        ?.split(" ")
        .filter((username: string) => username !== "BARBARA") || [];
    const usernames = this.mapToUserDataKeys(rawUsernames);

    // Log usernames and userData map keys before calling trackUsers
    console.log("Usernames to track:", usernames);
    console.log("UserData Map Keys:", Array.from(this.userData.keys()));

    return this.trackUsers(usernames);
  }

  public async sendReport(data: GPSResponse): Promise<APIResponse> {
    // Transform data into the required format
    const transformedData = Object.entries(data).reduce<
      Record<string, { lat: number; lon: number }>
    >((acc, [username, value]) => {
      acc[username] = {
        lat: value.message.lat,
        lon: value.message.lon,
      };
      return acc;
    }, {});

    // Prompt user to review data before sending
    const requestBody = {
      task: "gps",
      apikey: process.env.API_KEY,
      answer: transformedData,
    };
    const obfuscatedBody = { ...requestBody, apikey: "********" };
    console.log(
      "\n====================\nAbout to send the following data to /report endpoint:\n",
      JSON.stringify(obfuscatedBody, null, 2)
    );
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await new Promise((resolve) => {
      rl.question(
        "\nPress Enter to continue and send the report, or Ctrl+C to abort...",
        () => {
          rl.close();
          resolve(null);
        }
      );
    });

    try {
      const response = await axios.post(`${this.baseUrl}/report`, {
        task: "gps",
        apikey: process.env.API_KEY,
        answer: transformedData,
      });
      return response.data;
    } catch (error) {
      console.error("Error sending report:", error);
      throw error;
    }
  }
}
