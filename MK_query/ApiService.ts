import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

export class ApiService {
  private readonly apiKey: string;
  private readonly peopleEndpoint = "https://c3ntrala.ag3nts.org/people";
  private readonly placesEndpoint = "https://c3ntrala.ag3nts.org/places";
  private readonly reportEndpoint = "https://c3ntrala.ag3nts.org/report";

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable is not set");
    }
    this.apiKey = apiKey;
    console.log("API Service initialized with endpoints:", {
      people: this.peopleEndpoint,
      places: this.placesEndpoint,
    });
  }

  async queryPeople(name: string): Promise<string[]> {
    try {
      console.log(`Querying people API for name: "${name}"`);
      const requestBody = {
        apikey: this.apiKey,
        query: name,
      };
      console.log("Request body:", requestBody);

      const response = await fetch(this.peopleEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Parse the message string into an array of places
      if (data.message && typeof data.message === "string") {
        return data.message
          .split(" ")
          .filter((place: string) => place !== "[**RESTRICTED DATA**]");
      }
      return [];
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error querying people:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("Unknown error querying people:", error);
      }
      return [];
    }
  }

  async queryPlaces(city: string): Promise<string[]> {
    try {
      console.log(`Querying places API for city: "${city}"`);
      const requestBody = {
        apikey: this.apiKey,
        query: city,
      };
      console.log("Request body:", requestBody);

      const response = await fetch(this.placesEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Parse the message string into an array of people
      if (data.message && typeof data.message === "string") {
        return data.message.split(" ");
      }
      return [];
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error querying places:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("Unknown error querying places:", error);
      }
      return [];
    }
  }

  async fetchBarbaraNote(): Promise<string> {
    try {
      console.log("Fetching Barbara's note...");
      const response = await fetch(
        "https://c3ntrala.ag3nts.org/dane/barbara.txt"
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const text = await response.text();
      console.log("Successfully fetched Barbara's note, length:", text.length);
      return text;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching Barbara note:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("Unknown error fetching Barbara note:", error);
      }
      throw error;
    }
  }

  async reportCity(city: string): Promise<{ status: number; body: string }> {
    try {
      const requestBody = {
        task: "loop",
        apikey: this.apiKey,
        answer: city,
      };
      console.log(`Reporting city: ${city} to /report endpoint`);
      const response = await fetch(this.reportEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const responseBody = await response.text();
      console.log(`Report response for ${city}:`, {
        status: response.status,
        body: responseBody,
      });
      return { status: response.status, body: responseBody };
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error reporting city:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("Unknown error reporting city:", error);
      }
      return { status: 0, body: "Error occurred" };
    }
  }
}
