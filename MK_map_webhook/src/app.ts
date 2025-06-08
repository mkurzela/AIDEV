import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { getFieldDescription } from "./openaiService"; // Import the OpenAI service

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Example health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "MK_map_webhook is running." });
});

// 4x4 map description (Polish, max two words per field)
const map: string[][] = [
  ["START", "trawa", "drzewo", "budynek"],
  ["trawa", "wiatrak", "trawa", "trawa"],
  ["trawa", "trawa", "skały", "dwa drzewa"],
  ["skały", "skały", "samochód", "jaskinia"],
];

// POST /api/flight endpoint
app.post("/api/flight", async (req, res) => {
  const instruction = req.body?.instruction || "";
  console.log("Received instruction:", instruction);

  try {
    // Always start from (0,0)
    const description = await getFieldDescription(instruction, map);

    // Always return JSON with 'description'
    res.status(200).json({ description });
    console.log("Responded with:", { description });
  } catch (error) {
    console.error("Error:", error);
    res.status(200).json({ description: "błąd serwera" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MK_map_webhook listening on port ${PORT}`);
});
