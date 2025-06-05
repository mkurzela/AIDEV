import { ApiService } from "./ApiService";
import { Neo4jService } from "./Neo4jService";
import { OpenAIService } from "./OpenAIService";
import * as fs from "fs";
import * as path from "path";

interface User {
  id: number;
  username: string;
}

interface Connection {
  user1_id: number;
  user2_id: number;
}

class GraphApp {
  private apiService: ApiService;
  private neo4jService: Neo4jService;
  private openAIService: OpenAIService;
  private cacheFile: string;

  constructor() {
    this.apiService = new ApiService();
    this.openAIService = new OpenAIService();
    if (
      !process.env.NEO4J_URI ||
      !process.env.NEO4J_USER ||
      !process.env.NEO4J_PASSWORD
    ) {
      throw new Error("Neo4j environment variables are not set");
    }
    this.neo4jService = new Neo4jService(
      process.env.NEO4J_URI,
      process.env.NEO4J_USER,
      process.env.NEO4J_PASSWORD,
      this.openAIService
    );
    this.cacheFile = path.join(__dirname, "db_structure", "database_info.json");
  }

  private async getDataFromCache(): Promise<{
    users: User[];
    connections: Connection[];
  }> {
    try {
      const data = JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));
      console.log("Data from cache - Users:", data.tables.users.content.length);
      console.log(
        "Data from cache - Connections:",
        data.tables.connections.content.length
      );
      return {
        users: data.tables.users.content,
        connections: data.tables.connections.content,
      };
    } catch (error) {
      console.error("Error reading cache:", error);
      throw error;
    }
  }

  private async getDataFromAPI(): Promise<{
    users: User[];
    connections: Connection[];
  }> {
    const usersQuery = "SELECT id, username FROM users";
    const connectionsQuery = "SELECT user1_id, user2_id FROM connections";

    const [usersResponse, connectionsResponse] = await Promise.all([
      this.apiService.getData(usersQuery),
      this.apiService.getData(connectionsQuery),
    ]);

    if (!usersResponse.success || !connectionsResponse.success) {
      throw new Error("Failed to fetch data from API");
    }

    return {
      users: usersResponse.data,
      connections: connectionsResponse.data,
    };
  }

  private async createUserNodes(users: User[]): Promise<void> {
    console.log("Creating user nodes...");
    for (const user of users) {
      await this.neo4jService.addNode("User", {
        userId: user.id,
        username: user.username,
      });
    }
  }

  private async createConnections(connections: Connection[]): Promise<void> {
    console.log("Creating connections...");
    console.log("Number of connections to create:", connections.length);

    for (const conn of connections) {
      console.log(
        `Creating connection between users ${conn.user1_id} and ${conn.user2_id}`
      );
      try {
        await this.neo4jService.connectNodes(
          conn.user1_id,
          conn.user2_id,
          "KNOWS",
          {}
        );
        console.log(
          `Successfully created connection between ${conn.user1_id} and ${conn.user2_id}`
        );
      } catch (error) {
        console.error(
          `Failed to create connection between ${conn.user1_id} and ${conn.user2_id}:`,
          error
        );
      }
    }
  }

  private async findShortestPath(
    fromName: string,
    toName: string
  ): Promise<string> {
    const cypher = `
      MATCH (start:User), (end:User)
      WHERE toLower(start.username) = toLower($fromName)
      AND toLower(end.username) = toLower($toName)
      MATCH path = shortestPath((start)-[:KNOWS*]-(end))
      RETURN [node in nodes(path) | node.username] as path
    `;

    const result = await this.neo4jService.executeQuery(cypher, {
      fromName: fromName.toLowerCase(),
      toName: toName.toLowerCase(),
    });

    if (result.records.length === 0) {
      // List all users to help debug
      const allUsers = await this.neo4jService.executeQuery(
        "MATCH (u:User) RETURN u.username as username ORDER BY u.username"
      );
      const usernames = allUsers.records.map((r) => r.get("username"));
      throw new Error(
        `No path found between ${fromName} and ${toName}. Available users: ${usernames.join(", ")}`
      );
    }

    return result.records[0].get("path").join(",");
  }

  private async clearDatabase(): Promise<void> {
    console.log("Clearing database...");
    const cypher = "MATCH (n) DETACH DELETE n";
    await this.neo4jService.executeQuery(cypher);
  }

  private async printUserDebugInfo(username: string): Promise<void> {
    // Print node properties
    const nodeResult = await this.neo4jService.executeQuery(
      `MATCH (u:User) WHERE toLower(u.username) = toLower($username) RETURN u`,
      { username }
    );
    if (nodeResult.records.length === 0) {
      console.log(`No node found for user: ${username}`);
      return;
    }
    const nodeProps = nodeResult.records[0].get("u").properties;
    console.log(`Node for ${username}:`, nodeProps);

    // Print direct relationships
    const relResult = await this.neo4jService.executeQuery(
      `MATCH (u:User)-[r:KNOWS]-(other:User) WHERE toLower(u.username) = toLower($username) RETURN other.username as otherUser`,
      { username }
    );
    const connections = relResult.records.map((r) => r.get("otherUser"));
    console.log(`Direct connections for ${username}:`, connections);
  }

  private async sendSolution(path: string): Promise<void> {
    const apiKey = process.env.API_KEY || "";
    const answer = {
      task: "connections",
      apikey: apiKey,
      answer: path,
    };
    const response = await fetch("https://c3ntrala.ag3nts.org/report", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(answer),
    });
    const result = await response.text();
    console.log("Report response:", result);
  }

  async initialize(): Promise<void> {
    try {
      // Clear the database first
      await this.clearDatabase();

      // Get data from cache or API
      const data = await this.getDataFromCache();

      // Create user nodes
      await this.createUserNodes(data.users);

      // Create connections
      await this.createConnections(data.connections);

      console.log("Graph database initialized successfully");

      // Debug info for Łukasz and Barbara
      await this.printUserDebugInfo("Łukasz");
      await this.printUserDebugInfo("Barbara");
    } catch (error) {
      console.error("Error initializing graph database:", error);
      throw error;
    }
  }

  async findPath(fromName: string, toName: string): Promise<string> {
    try {
      const path = await this.findShortestPath(fromName, toName);
      await this.sendSolution(path);
      return path;
    } catch (error) {
      console.error("Error finding path:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.neo4jService.close();
  }
}

// Example usage
async function main() {
  const app = new GraphApp();
  try {
    await app.initialize();
    const path = await app.findPath("Rafał", "Barbara");
    console.log("Path found:", path);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await app.close();
  }
}

main();
