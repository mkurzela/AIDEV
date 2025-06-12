import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { processRequest, resetThreadMemory } from "./openaiService";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "MK_fake_webhook is running." });
});

// Reset endpoint
app.post("/api/reset", (req, res) => {
  try {
    const threadId = req.body.threadId || "default";
    const thread = { memory: {}, messages: [] };
    resetThreadMemory(thread);
    res.json({ status: "ok", message: "Thread memory reset successfully" });
  } catch (error) {
    console.error("Error resetting thread:", error);
    res.status(200).json({ answer: "Error resetting thread" });
  }
});

// Main endpoint for handling requests
app.post("/api/heart", async (req, res) => {
  try {
    const requestData = req.body;
    console.log("\n=== New Request ===");
    console.log("Request data:", JSON.stringify(requestData, null, 2));

    // Determine request type based on content
    let type = "text";
    let content = requestData.question || requestData.content || "";

    // Try to get the external agent's response from various possible fields
    let externalResponse =
      requestData.answer ||
      requestData.response ||
      requestData.reply ||
      requestData.message ||
      requestData.text ||
      "";

    // Check if it's an image request
    if (content.includes("https://rafal.ag3nts.org/proxy/obraz_")) {
      type = "image";
      content =
        content.match(
          /https:\/\/rafal\.ag3nts\.org\/proxy\/obraz_[^.\s]+\.png/
        )?.[0] || "";
      console.log("Detected image request:", content);
    }
    // Check if it's an audio request
    else if (content.includes("https://rafal.ag3nts.org/proxy/probka_")) {
      type = "audio";
      content =
        content.match(
          /https:\/\/rafal\.ag3nts\.org\/proxy\/probka_[^.\s]+\.mp3/
        )?.[0] || "";
      console.log("Detected audio request:", content);
    }
    // Check if it's an instructions request
    else if (content.includes("Czekam na nowe instrukcje")) {
      type = "instructions";
      console.log("Detected instructions request");
      console.log("External agent response:", externalResponse);
      console.log("Full request data:", JSON.stringify(requestData, null, 2));
    }

    console.log("Processing request with type:", type);
    console.log("Thread ID:", requestData.threadId || "default");
    console.log("External response:", externalResponse);

    const answer = await processRequest({
      type,
      content,
      threadId: requestData.threadId || "default",
      externalResponse,
    });

    // Always return 200 OK with the required JSON format
    res.status(200).json({ answer });
    console.log("Response sent:", JSON.stringify({ answer }, null, 2));
    console.log("=== End Request ===\n");
  } catch (error) {
    console.error("\n=== Error Processing Request ===");
    console.error("Error details:", error);
    // Even in case of error, return 200 OK with error message
    res.status(200).json({ answer: "Error processing request" });
    console.error("=== End Error ===\n");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MK_fake_webhook listening on port ${PORT}`);
});
