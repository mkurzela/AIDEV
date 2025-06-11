import axios from "axios";
import { SourceResponse, TimestampResponse, ReportPayload } from "../types";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env file one level up
dotenv.config({ path: path.join(__dirname, "../../../.env") });

export class WebService {
  private readonly baseUrl = "https://rafal.ag3nts.org";
  private readonly reportUrl = "https://rafal.ag3nts.org/b46c3%22";
  private readonly apiKey: string;
  private readonly source0Url: string;
  private readonly source1Url: string;
  private readonly tokenUrl: string;
  private readonly password: string;

  constructor() {
    this.apiKey = process.env.API_KEY || "";
    if (!this.apiKey) {
      throw new Error("API_KEY not found in environment variables");
    }
    this.source0Url = `${this.baseUrl}/source0`;
    this.source1Url = `${this.baseUrl}/source1`;
    this.tokenUrl = `${this.baseUrl}/b46c3%22`;
    this.password = "NONOMNISMORIAR";
  }

  async getTimestamp(): Promise<{ timestamp: number; signature: string }> {
    // Step 1: Get token using password
    const tokenResponse = await axios.post(this.tokenUrl, {
      password: this.password,
    });

    if (tokenResponse.data.code !== 0) {
      throw new Error(
        "Failed to get token: " + JSON.stringify(tokenResponse.data)
      );
    }

    const token = tokenResponse.data.message;
    console.log("Received token:", token);

    // Step 2: Get timestamp and signature using token
    const timestampResponse = await axios.post(this.tokenUrl, {
      sign: token,
    });

    if (timestampResponse.data.code !== 0) {
      throw new Error(
        "Failed to get timestamp: " + JSON.stringify(timestampResponse.data)
      );
    }

    console.log("Received timestamp data:", timestampResponse.data.message);
    return timestampResponse.data.message;
  }

  async getSourceData(url: string): Promise<SourceResponse> {
    try {
      const response = await axios.get<SourceResponse>(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching source data from ${url}:`, error);
      throw error;
    }
  }

  async getSource0Data(): Promise<{ task: string; data: string[] }> {
    const response = await axios.get(this.source0Url);
    return response.data;
  }

  async getSource1Data(): Promise<{ task: string; data: string[] }> {
    const response = await axios.get(this.source1Url);
    return response.data;
  }

  async submitReport(report: {
    apikey: string;
    timestamp: number;
    signature: string;
    answer: string;
  }): Promise<any> {
    console.log("\nSubmitting report to endpoint...");
    const response = await axios.post(this.tokenUrl, report);
    console.log(
      "Response from endpoint:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  }
}
