import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class ApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = "https://c3ntrala.ag3nts.org/apidb";
    this.apiKey = process.env.API_KEY || "";

    if (!this.apiKey) {
      throw new Error("API_KEY is not set in environment variables");
    }
  }

  private async makeRequest(query: string): Promise<ApiResponse> {
    try {
      const url = this.baseUrl;
      console.log(`Making request to: ${url}`);
      console.log(`Query: ${query}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "database",
          apikey: this.apiKey,
          query: query,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
        return {
          success: false,
          error: data.message || "Unknown error occurred",
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Request failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async getData(query: string): Promise<ApiResponse> {
    return this.makeRequest(query);
  }

  async postData(query: string): Promise<ApiResponse> {
    return this.makeRequest(query);
  }

  async putData(query: string): Promise<ApiResponse> {
    return this.makeRequest(query);
  }

  async deleteData(query: string): Promise<ApiResponse> {
    return this.makeRequest(query);
  }
}
