require("dotenv/config");
const express = require("express");
const cors = require("cors");
const archiver = require("archiver");
const fs = require("fs-extra");
const path = require("path");
const geminiService = require("./geminiService");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Helper function to parse AI response and extract files
function parseAiResponse(aiResponse) {
  const files = [];
  const startMarker = "--- START: ";
  const endMarker = "--- END: ";

  let currentIndex = 0;

  while (true) {
    // Find the start marker
    const startIndex = aiResponse.indexOf(startMarker, currentIndex);
    if (startIndex === -1) break;

    // Extract the file path
    const pathStart = startIndex + startMarker.length;
    const pathEnd = aiResponse.indexOf(" ---", pathStart);
    if (pathEnd === -1) break;

    const filePath = aiResponse.substring(pathStart, pathEnd);

    // Find the end of the start marker line
    const codeStart = aiResponse.indexOf("\n", pathEnd) + 1;

    // Find the end marker for this file
    const endMarkerFull = `${endMarker}${filePath} ---`;
    const codeEnd = aiResponse.indexOf(endMarkerFull, codeStart);
    if (codeEnd === -1) break;

    // Extract the raw code block
    const rawCode = aiResponse.substring(codeStart, codeEnd);

    // Clean the code: Remove markdown fences and trim whitespace
    const cleanedCode = rawCode
      .replace(/^```[\w]*\n?/i, "") // Remove opening fence with optional language identifier
      .replace(/\n?```\s*$/i, "") // Remove closing fence
      .trim(); // Trim whitespace

    files.push({
      path: filePath,
      code: cleanedCode,
    });

    // Move to the next file
    currentIndex = codeEnd + endMarkerFull.length;
  }

  return files;
}

// POST route for interactive chat planning
app.post("/api/plan-chat", async (req, res) => {
  try {
    const { history, userMessage } = req.body;

    console.log("Received chat planning request:", userMessage);

    // Build conversation history string
    const historyText = history
      .map((msg) => `${msg.role}: ${msg.text}`)
      .join("\n");

    // Create the planner meta-prompt
    const metaPrompt = `You are a "Dev-Genie" planning a project with a junior developer.

Here is the conversation so far:
${historyText}

The user just said: "${userMessage}"

Your job is to:
1. Respond with a helpful chat message.
2. Update the project's file list based on their request.

Respond in this EXACT format, with no other text:
CHAT: [Your chat message to the user goes here]
FILES: [A JSON array of file paths, like ["server.js", "package.json"]]
`;

    console.log("Planner meta-prompt created");

    // Call the Gemini API
    const aiResponse = await geminiService.generateContent(metaPrompt);

    console.log("AI Response received for planning");

    // Parse the AI response to extract chat message and file list
    const chatMatch = aiResponse.match(/CHAT:\s*(.+?)(?=\nFILES:|$)/s);
    const filesMatch = aiResponse.match(/FILES:\s*(\[.+?\])/s);

    if (!chatMatch || !filesMatch) {
      throw new Error("AI response format is invalid. Could not parse CHAT or FILES.");
    }

    const aiMessage = chatMatch[1].trim();
    const fileList = JSON.parse(filesMatch[1].trim());

    console.log("Parsed AI message and file list");
    console.log("File list:", fileList);

    // Send response back to frontend
    res.json({
      aiMessage: aiMessage,
      fileList: fileList,
    });
  } catch (error) {
    console.error("Error in chat planning:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST route for generating project scaffolds (Junior Flow)
app.post("/api/generate", async (req, res) => {
  try {
    // Get the user's chat prompt
    const userPrompt = req.body.chatPrompt;

    console.log("Received user prompt:", userPrompt);

    // Create the meta-prompt to instruct the AI
    const metaPrompt = `You are a "Dev-Genie," an expert 10x developer who builds project boilerplates. A junior developer has given you the following request:

${userPrompt}

Your task is to generate the complete, error-free boilerplate code for this project. You MUST format the response in a way that can be parsed. Start each file with a unique marker, like "--- START: server/server.js ---", and end it with "--- END: server/server.js ---". Provide the complete code for each file.`;

    console.log("Meta-prompt created");

    // Call the Gemini API
    const aiResponse = await geminiService.generateContent(metaPrompt);

    console.log("AI Response received");

    // Parse the AI response to extract files
    const files = parseAiResponse(aiResponse);
    console.log(`Parsed ${files.length} files from AI response`);

    // Create a unique temporary directory
    const tempDir = path.join(__dirname, "temp", Date.now().toString());
    console.log(`Creating temp directory: ${tempDir}`);

    // Write files to temp directory
    for (const file of files) {
      const filePath = path.join(tempDir, file.path);
      fs.outputFileSync(filePath, file.code);
      console.log(`Written file: ${file.path}`);
    }

    // Set response headers for zip download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="project.zip"');

    // Create archive and pipe to response
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add all files from temp directory to the zip
    archive.directory(tempDir, false);

    // Finalize the archive
    await archive.finalize();
    console.log("Archive finalized and sent to client");

    // Cleanup: delete temp directory after response is sent
    res.on("finish", () => {
      fs.remove(tempDir)
        .then(() => console.log(`Cleaned up temp directory: ${tempDir}`))
        .catch((err) =>
          console.error(`Error cleaning up temp directory: ${err.message}`)
        );
    });
  } catch (error) {
    console.error("Error generating project:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Dev-Genie Backend is running on http://localhost:${PORT}`);
  console.log(`💬 Chat Planning: POST /api/plan-chat`);
  console.log(`📦 Project Generation: POST /api/generate`);
});
