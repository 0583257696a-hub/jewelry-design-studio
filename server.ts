/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for AI assistant
  app.post("/api/gemini/assistant", async (req: any, res: any) => {
    try {
      const { prompt, currentDesign } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "מלא פרומפט בבקשה" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "מפתח API של Gemini אינו מוגדר במערכת. אנא הגדר אותו בהגדרות הסודות."
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `
          User Hebrew input: "${prompt}"
          Current Design: ${JSON.stringify(currentDesign)}
        `,
        config: {
          systemInstruction: `
            You are the "ES LEVIEV Jewelry Design Studio 360" AI design assistant, a premium jewelry product CAD engineer.
            Your task is to analyze the user's Hebrew instruction and output a list of structured design actions.
            
            Supported action structures:
            1. CHANGE_METAL:
               - { type: "CHANGE_METAL", metalType: "yellow_gold"|"white_gold"|"rose_gold"|"platinum", karat: 9|10|14|18|950 }
            2. UPDATE_MEASUREMENT:
               - { type: "UPDATE_MEASUREMENT", field: "width"|"thickness"|"innerDiameter"|"length"|"headHeight", value: number }
            3. ADD_ENGRAVING:
               - { type: "ADD_ENGRAVING", text: "text inside or outside", location: "inside"|"outside" }
            4. ADD_HALO:
               - { type: "ADD_HALO", targetStoneId: "center_stone_solitaire" (or current center stone id), stoneShape: "round"|"princess"|"oval", stoneSizeMm: number, quantity: number, distanceMm: number }

            Rule 1: If the user requests yellow gold, white gold, rose gold, or platinum, create a CHANGE_METAL action.
            Rule 2: If the user requests to change width, thickness, size (innerDiameter), head height, or length, create an UPDATE_MEASUREMENT action. Make sure the value is a number in mm (or cm for bracelet length).
            Rule 3: If the user wants engraving, create an ADD_ENGRAVING action.
            Rule 4: If the user wants a halo around the center stone, create an ADD_HALO action.
            Rule 5: Translate everything into clear, premium, brand-authentic Hebrew and explain what changes you are suggesting inside "explanationHebrew".
            
            Respond STRICTLY with the requested JSON schema.
          `,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanationHebrew: {
                type: Type.STRING,
                description: "הסבר מנומס ויפה בעברית המפרט בדיוק אילו שינויים יבוצעו"
              },
              actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    metalType: { type: Type.STRING },
                    karat: { type: Type.INTEGER },
                    color: { type: Type.STRING },
                    field: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                    location: { type: Type.STRING },
                    stoneShape: { type: Type.STRING },
                    stoneSizeMm: { type: Type.NUMBER },
                    quantity: { type: Type.INTEGER },
                    distanceMm: { type: Type.NUMBER }
                  },
                  required: ["type"]
                }
              }
            },
            required: ["explanationHebrew", "actions"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text received from Gemini API");
      }
      const parsed = JSON.parse(text);
      res.json(parsed);

    } catch (e: any) {
      console.error("Gemini Assistant route error:", e);
      res.status(500).json({ error: e.message || "שגיאה בעיבוד בקשת ה-AI" });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
