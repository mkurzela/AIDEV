import { ApiService } from "./ApiService";
import { TextProcessor } from "./TextProcessor";
import * as dotenv from "dotenv";

dotenv.config();

class App {
  private apiService: ApiService;
  private textProcessor: TextProcessor;
  private processedNames: Set<string> = new Set();
  private processedCities: Set<string> = new Set();
  private nameQueue: string[] = [];
  private cityQueue: string[] = [];
  private barbaraLocations: Set<string> = new Set();
  private initialCities: Set<string> = new Set(); // Track cities from initial note

  constructor() {
    this.apiService = new ApiService();
    this.textProcessor = new TextProcessor();
  }

  async initialize() {
    try {
      // Fetch and process Barbara's note
      const noteText = await this.apiService.fetchBarbaraNote();
      await this.textProcessor.processText(noteText);

      // Initialize queues with initial data
      this.nameQueue = this.textProcessor.getNames();
      this.cityQueue = this.textProcessor.getCities();

      // Store initial cities to exclude them from final results
      this.cityQueue.forEach((city) => this.initialCities.add(city));

      console.log("Initial names:", this.nameQueue);
      console.log("Initial cities:", this.cityQueue);
    } catch (error) {
      console.error("Error during initialization:", error);
      throw error;
    }
  }

  async processName(name: string) {
    if (this.processedNames.has(name)) return;
    this.processedNames.add(name);

    // Use only the first name (first word) for the API query
    const firstName = name.split(" ")[0];
    console.log(`Processing name: ${name} (using ${firstName} for API query)`);

    const places = await this.apiService.queryPeople(firstName);
    console.log(`Found places for ${firstName}:`, places);

    for (const place of places) {
      if (!this.processedCities.has(place)) {
        this.cityQueue.push(place);
        console.log(`Added new city to queue: ${place}`);
      }
    }
  }

  async processCity(city: string) {
    if (this.processedCities.has(city)) return;
    this.processedCities.add(city);

    console.log(`Processing city: ${city}`);
    const people = await this.apiService.queryPlaces(city);
    console.log(`Found people in ${city}:`, people);

    for (const person of people) {
      // Check if Barbara is mentioned in this city
      if (person.toUpperCase() === "BARBARA") {
        // Only add to barbaraLocations if it's not one of the initial cities
        if (!this.initialCities.has(city)) {
          console.log(`Found Barbara in new location: ${city}`);
          this.barbaraLocations.add(city);
        } else {
          console.log(`Found Barbara in initial city (ignoring): ${city}`);
        }
      }
      // Add new names to the queue
      if (!this.processedNames.has(person)) {
        this.nameQueue.push(person);
        console.log(`Added new name to queue: ${person}`);
      }
    }
  }

  async run() {
    await this.initialize();

    while (this.nameQueue.length > 0 || this.cityQueue.length > 0) {
      // Process names
      while (this.nameQueue.length > 0) {
        const name = this.nameQueue.shift()!;
        await this.processName(name);
      }

      // Process cities
      while (this.cityQueue.length > 0) {
        const city = this.cityQueue.shift()!;
        await this.processCity(city);
      }
    }

    console.log(
      "\nInitial cities (where Barbara was):",
      Array.from(this.initialCities)
    );
    console.log(
      "\nPotential Barbara locations (where she might be now):",
      Array.from(this.barbaraLocations)
    );

    // Report each city to the /report endpoint
    for (const city of this.barbaraLocations) {
      const result = await this.apiService.reportCity(city);
      console.log(`Full response for ${city}:`, result);
      if (result.status === 200) {
        console.log(`SUCCESS: ${city} is the correct answer!`);
        break;
      } else {
        console.log(
          `Tried ${city}, but did not get 200 (got ${result.status})`
        );
      }
    }
  }
}

// Run the application
const app = new App();
app.run().catch(console.error);
