const axios = require("axios");

class GeminiService {
  constructor() {
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`;
    console.log("GeminiService (axios) initialized.");
  }

  async generateContent(prompt) {
    try {
      const response = await axios.post(
        this.endpoint,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { "Content-Type": "application/json" } }
      );

      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No valid text response received from Gemini API.");
      }

      return text.trim();
    } catch (error) {
      this.handleApiError(error);
    }
  }

  handleApiError(error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const geminiMessage = error.response?.data?.error?.message;
      const errorMessage = `Gemini API Error (Status ${status}): ${
        geminiMessage || "Unknown error"
      }`;
      throw new Error(errorMessage);
    }
    throw new Error(
      "An unknown error occurred while communicating with the Gemini API."
    );
  }
}

module.exports = new GeminiService();

