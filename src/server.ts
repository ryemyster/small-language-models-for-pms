/**
 * server.ts — The classifier endpoint.
 *
 * This is the bridge between the trained Python model and the rest of your code.
 *
 * The real-world pattern: Python trains the model and saves it as a file.
 * Everything else — your product, your scripts, your automations — calls a simple
 * HTTP endpoint. The language you use to train doesn't have to be the language you
 * use to deploy.
 *
 * This server:
 *   1. Loads the trained model using a Python subprocess
 *   2. Exposes a POST /classify endpoint
 *   3. Returns { label, confidence } for any feedback text you send it
 *
 * Start it with: npm run start
 * It runs at: http://localhost:3000
 */

import express, { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";

const app = express();
app.use(express.json());

const PORT = 3000;
const MODEL_DIR = path.join(process.cwd(), "training", "model");

// ─────────────────────────────────────────────
// Health check — useful for knowing the server is up
// GET http://localhost:3000/health
// ─────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// ─────────────────────────────────────────────
// Classify endpoint
// POST http://localhost:3000/classify
// Body: { "text": "your feedback text here" }
// Returns: { "label": "bug_report", "confidence": 0.94 }
// ─────────────────────────────────────────────
app.post("/classify", (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== "string" || text.trim() === "") {
    res.status(400).json({ error: "Request body must include a non-empty 'text' field." });
    return;
  }

  // We call Python to run the model. The Python script reads the model from disk,
  // runs the text through it, and prints the result as JSON to stdout.
  // This is the simplest way to call a HuggingFace model from TypeScript.
  const python = spawn("python3", [
    "-c",
    `
import json, sys
from transformers import pipeline

# Load the trained model from the saved directory
# pipeline() is a HuggingFace helper that handles tokenization + inference in one call
classifier = pipeline("text-classification", model="${MODEL_DIR}", tokenizer="${MODEL_DIR}")

text = sys.argv[1]
result = classifier(text)[0]

# result is e.g. {"label": "bug_report", "score": 0.9432}
print(json.dumps({"label": result["label"], "confidence": round(result["score"], 4)}))
    `.trim(),
    text.trim(),
  ]);

  let output = "";
  let errorOutput = "";

  python.stdout.on("data", (data: Buffer) => {
    output += data.toString();
  });

  python.stderr.on("data", (data: Buffer) => {
    // HuggingFace prints progress messages to stderr — ignore those
    errorOutput += data.toString();
  });

  python.on("close", (code: number) => {
    if (code !== 0) {
      console.error("Python process failed:\n", errorOutput);

      // Give a useful error message depending on likely cause
      if (errorOutput.includes("No such file or directory") || errorOutput.includes("OSError")) {
        res.status(503).json({
          error: "Model not found. Run 'python training/train.py' first to generate the model.",
        });
      } else {
        res.status(500).json({ error: "Classification failed. Check server logs for details." });
      }
      return;
    }

    try {
      const result = JSON.parse(output.trim());
      res.json(result);
    } catch {
      console.error("Failed to parse Python output:", output);
      res.status(500).json({ error: "Unexpected output from classifier." });
    }
  });
});

// ─────────────────────────────────────────────
// Start the server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Classifier server running at http://localhost:${PORT}`);
  console.log(`POST to http://localhost:${PORT}/classify with { "text": "your feedback here" }`);
  console.log(`\nWaiting for requests...`);
});
