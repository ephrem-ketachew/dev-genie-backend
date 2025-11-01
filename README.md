# Dev-Genie Backend

An AI-powered project scaffolder backend API built for a 5-hour hackathon.

## Overview

Dev-Genie helps developers quickly scaffold projects based on their experience level and architecture preferences. This backend API handles project generation requests from the frontend.

## Tech Stack

- **Node.js** with Express.js
- **Google Gemini API (via Axios)** for AI-powered code generation
- **Axios** for HTTP requests to Gemini API
- **CORS** for cross-origin requests
- **Archiver** for creating project archives
- **fs-extra** for enhanced file system operations

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note:** 
- Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Make sure your API key is active and has access to Gemini models
- The server uses the `gemini-2.5-flash-preview-05-20` model via custom Axios service

### Running the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

## Workflow

Dev-Genie supports two modes of operation:

### 1. **Interactive Chat Planning Mode** (Recommended)
1. User starts chatting: "I want to build a blog"
2. Frontend sends `POST /api/plan-chat` with conversation history
3. AI responds with a message and file list
4. User continues: "Add authentication", "Add a Dockerfile", etc.
5. Each request updates the file list based on conversation
6. When user says "done", frontend calls `POST /api/generate` with final file list
7. User downloads the complete project as a ZIP

### 2. **Direct Generation Mode**
1. User provides a single comprehensive prompt
2. Frontend sends `POST /api/generate` with the full requirements
3. User immediately downloads the generated project ZIP

## API Endpoints

### POST `/api/plan-chat`

**Interactive chat planning endpoint** - Allows users to iteratively build their project structure through conversation.

**Request Body:**
```json
{
  "history": [
    { "role": "user", "text": "I want to build a blog" },
    { "role": "assistant", "text": "Great! I'll start with a basic structure..." }
  ],
  "userMessage": "Add a Dockerfile"
}
```

**Response:**
```json
{
  "aiMessage": "Perfect! I'll add a Dockerfile to containerize your application. Here's the updated file list.",
  "fileList": ["server.js", "routes/posts.js", "package.json", "Dockerfile"]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**How it works:**
1. Receives conversation history and the latest user message
2. AI analyzes the conversation and user's request
3. Returns a conversational response and an updated file list
4. Frontend can display the message and show the file structure
5. User continues chatting until they're satisfied
6. When user says "done", frontend calls `/api/generate` with the final file list

---

### POST `/api/generate`

Generate a new project scaffold using AI based on a chat prompt (Junior Flow).

**Request Body:**
```json
{
  "chatPrompt": "The user wants a simple blog with a Node.js backend and a React frontend."
}
```

**Response:**
- **Content-Type:** `application/zip`
- **Returns:** A downloadable ZIP file (`project.zip`) containing the complete project structure with all generated files

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**How it works:**
1. Receives a natural language prompt describing the project
2. Uses AI (Gemini) to generate structured code with file markers
3. Parses the AI response to extract individual files and their paths
4. Creates a temporary directory and writes all files
5. Zips the entire project structure
6. Streams the ZIP file back to the client
7. Automatically cleans up temporary files after download

## Project Structure

```
dev-genie-backend/
├── server.js           # Main Express server with AI logic
├── geminiService.js    # Custom Gemini API service (Axios-based)
├── package.json        # Dependencies and scripts
├── .env               # Environment variables (create this)
├── .gitignore         # Git ignore rules
├── temp/              # Temporary directory for generated projects (auto-created/cleaned)
└── README.md          # This file
```

## Testing

You can test the API using curl, Postman, or any HTTP client:

### Testing Chat Planning Endpoint

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/plan-chat \
  -H "Content-Type: application/json" \
  -d '{
    "history": [],
    "userMessage": "I want to build a REST API for a blog"
  }'
```

**Using Postman:**
1. Set method to POST
2. URL: `http://localhost:3000/api/plan-chat`
3. Body: Raw JSON
```json
{
  "history": [
    { "role": "user", "text": "I want to build a blog" },
    { "role": "assistant", "text": "Great! I'll set up a basic Express server with routes." }
  ],
  "userMessage": "Add user authentication"
}
```
4. You'll receive a JSON response with `aiMessage` and `fileList`

### Testing Project Generation Endpoint

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"chatPrompt": "Create a simple Express REST API with a users endpoint"}' \
  --output project.zip
```

**Using Postman:**
1. Set method to POST
2. URL: `http://localhost:3000/api/generate`
3. Body: Raw JSON
```json
{
  "chatPrompt": "I want a simple blog with a Node.js backend and a React frontend"
}
```
4. Send and save the response as `project.zip`

## Features

- ✅ **Interactive Chat Planning** - Iteratively build project structure through conversation
- ✅ AI-powered code generation using Google's Gemini 2.5 Flash (via custom Axios service)
- ✅ Junior Flow: Chat-based project generation
- ✅ Meta-prompt engineering for structured code output
- ✅ Automatic file parsing from AI response (file markers)
- ✅ Smart code cleaning (removes markdown fences from generated code)
- ✅ Dynamic file structure creation with nested directories
- ✅ ZIP file generation and streaming
- ✅ Automatic temporary file cleanup
- ✅ Error handling and comprehensive logging
- ✅ Environment variable configuration with dotenv

## Next Steps / Potential Enhancements

- Add Advanced Flow with predefined architecture templates
- Implement project validation and syntax checking
- Add support for more AI models
- Create frontend integration examples
- Add rate limiting and API authentication
- Implement caching for common project types
- Add support for custom file markers/formats

## License

ISC

