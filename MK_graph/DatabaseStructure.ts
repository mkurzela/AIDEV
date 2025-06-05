import * as fs from "fs";
import * as path from "path";

interface TableStructure {
  name: string;
  createStatement: string;
  columns: {
    Field: string;
    Type: string;
    Null: string;
    Key: string;
    Default: string | null;
    Extra: string;
  }[];
  content?: any[];
}

interface DatabaseInfo {
  tables: { [key: string]: TableStructure };
  lastUpdated: string;
}

export class DatabaseStructure {
  private tables: Map<string, TableStructure> = new Map();
  private readonly dbStructureDir = "db_structure";
  private readonly dbInfoFile = path.join(
    this.dbStructureDir,
    "database_info.json"
  );

  constructor() {
    // Create directory if it doesn't exist
    if (!fs.existsSync(this.dbStructureDir)) {
      fs.mkdirSync(this.dbStructureDir, { recursive: true });
    }
  }

  private saveToFile() {
    const dbInfo: DatabaseInfo = {
      tables: Object.fromEntries(this.tables),
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(this.dbInfoFile, JSON.stringify(dbInfo, null, 2));
    console.log(`Database structure and content saved to ${this.dbInfoFile}`);
  }

  private loadFromFile(): boolean {
    try {
      if (fs.existsSync(this.dbInfoFile)) {
        const data = fs.readFileSync(this.dbInfoFile, "utf-8");
        const dbInfo: DatabaseInfo = JSON.parse(data);
        this.tables = new Map(Object.entries(dbInfo.tables));
        console.log(
          `Database structure and content loaded from ${this.dbInfoFile}`
        );
        console.log(`Last updated: ${dbInfo.lastUpdated}`);
        return true;
      }
    } catch (error) {
      console.error("Error loading database structure:", error);
    }
    return false;
  }

  async exploreDatabase(apiService: any) {
    // Try to load from file first
    if (this.loadFromFile()) {
      console.log("Using cached database structure and content");
      return;
    }

    console.log("Fetching fresh database structure and content...");

    // Get list of tables
    const tablesResponse = await apiService.getData("SHOW TABLES");
    if (!tablesResponse.success) {
      console.error("Failed to get tables:", tablesResponse.error);
      return;
    }

    // Get tables from the reply array
    const tables = tablesResponse.data.reply || [];

    // Process each table
    for (const table of tables) {
      const tableName = table.Tables_in_banan;
      if (!tableName) {
        console.error("Invalid table name format:", table);
        continue;
      }

      console.log(`\nExploring table: ${tableName}`);

      // Get table structure using DESC
      const structureResponse = await apiService.getData(`DESC ${tableName}`);
      if (!structureResponse.success) {
        console.error(
          `Failed to get structure for table ${tableName}:`,
          structureResponse.error
        );
        continue;
      }

      // Get create table statement
      const createResponse = await apiService.getData(
        `SHOW CREATE TABLE ${tableName}`
      );
      if (!createResponse.success) {
        console.error(
          `Failed to get create statement for table ${tableName}:`,
          createResponse.error
        );
        continue;
      }

      // Get table content using SELECT
      const contentResponse = await apiService.getData(
        `SELECT * FROM ${tableName}`
      );
      if (!contentResponse.success) {
        console.error(
          `Failed to get content for table ${tableName}:`,
          contentResponse.error
        );
        continue;
      }

      // Check if we have valid data
      if (!structureResponse.data?.reply) {
        console.error(`Invalid structure response for table ${tableName}`);
        continue;
      }

      if (!createResponse.data?.reply?.[0]?.["Create Table"]) {
        console.error(
          `Invalid create statement response for table ${tableName}`
        );
        continue;
      }

      // Store table information
      this.tables.set(tableName, {
        name: tableName,
        createStatement: createResponse.data.reply[0]["Create Table"],
        columns: structureResponse.data.reply,
        content: contentResponse.data.reply || [],
      });

      // Log table structure
      console.log(`\nTable Structure for ${tableName}:`);
      console.log("Columns:");
      if (Array.isArray(structureResponse.data.reply)) {
        structureResponse.data.reply.forEach((column: any) => {
          if (column && column.Field) {
            console.log(
              `  - ${column.Field}: ${column.Type} ${column.Null === "YES" ? "NULL" : "NOT NULL"} ${column.Key ? `(${column.Key})` : ""}`
            );
          } else {
            console.error(`Invalid column format:`, column);
          }
        });
      } else {
        console.error(`Structure data is not an array for table ${tableName}`);
      }

      // Log table content
      console.log(`\nTable Content for ${tableName}:`);
      if (contentResponse.data?.reply) {
        console.log(JSON.stringify(contentResponse.data.reply, null, 2));
      }
    }

    // Save the database structure and content to file
    this.saveToFile();

    console.log("\nDatabase exploration complete!");
    console.log(`Found ${this.tables.size} tables.`);
  }

  getTableStructure(tableName: string): TableStructure | undefined {
    return this.tables.get(tableName);
  }

  getAllTables(): string[] {
    return Array.from(this.tables.keys());
  }

  getTableColumns(tableName: string): any[] | undefined {
    return this.tables.get(tableName)?.columns;
  }

  getTableContent(tableName: string): any[] | undefined {
    return this.tables.get(tableName)?.content;
  }

  // Helper method to get table information in a readable format
  getTableInfo(tableName: string): string {
    const table = this.tables.get(tableName);
    if (!table) return `Table ${tableName} not found`;

    let info = `Table: ${tableName}\n`;
    info += `Create Statement:\n${table.createStatement}\n\n`;
    info += `Columns:\n`;
    table.columns.forEach((column) => {
      info += `  - ${column.Field}: ${column.Type} ${column.Null === "YES" ? "NULL" : "NOT NULL"} ${column.Key ? `(${column.Key})` : ""}\n`;
    });
    info += `\nContent:\n`;
    info += JSON.stringify(table.content, null, 2);
    return info;
  }
}
