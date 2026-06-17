import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Route for speech-to-text
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioData, mimeType } = req.body;
      
      if (!audioData) {
        return res.status(400).json({ error: "Missing audioData" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: audioData,
                  mimeType: mimeType || "audio/webm",
                },
              },
              {
                text: "Transcribe the following voice memo into text. Be as accurate as possible and format it properly. Do not include any other commentary, ONLY the transcription. If there are multiple sentences, format them nicely.",
              },
            ],
          },
        ],
      });

      res.json({ text: response.text?.trim() || "" });
    } catch (err: any) {
      console.error("Transcription error:", err);
      res.status(500).json({ error: err.message || "Failed to transcribe audio." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
