/**
 * server.ts — The classifier endpoint.
 *
 * The real-world pattern: Python trains the model and saves it to disk.
 * Everything else — your product, your scripts, your automations — calls
 * a simple HTTP endpoint and gets a structured result back.
 *
 * What this server does:
 *   1. Loads the trained model ONCE when the server starts (not per request)
 *   2. Keeps a persistent Python process alive to handle classifications
 *   3. Exposes POST /classify → returns { label, confidence }
 *   4. Exposes GET /health → tells you whether the model is loaded and ready
 *
 * Start it with: npm run start
 * It runs at: http://localhost:3000
 */

import express, { Request, Response } from "express";
import { spawn, ChildProcess } from "child_process";
import path from "path";

const app = express();
app.use(express.json());

const PORT = 3000;
const MODEL_DIR = path.join(process.cwd(), "training", "model");

// ─────────────────────────────────────────────
// Python classifier daemon
//
// This Python script loads the model once, then sits in a loop reading
// JSON requests from stdin and writing JSON responses to stdout.
//
// One request in → one response out. The model stays loaded between requests.
// That's what makes inference fast: no disk load, no model init per call.
// ─────────────────────────────────────────────
const CLASSIFIER_DAEMON = `
import sys, json, os
sys.stderr.write("[classifier] Loading model from disk...\\n")
sys.stderr.flush()

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
except ImportError as e:
    sys.stderr.write(f"[classifier] Missing dependency: {e}\\n")
    sys.stderr.write("[classifier] Run: pip install -r requirements.txt\\n")
    sys.exit(1)

model_dir = sys.argv[1]

if not os.path.exists(model_dir):
    sys.stderr.write(f"[classifier] Model not found at {model_dir}\\n")
    sys.stderr.write("[classifier] Run: python3 training/train.py\\n")
    sys.exit(1)

tokenizer = AutoTokenizer.from_pretrained(model_dir)
model = AutoModelForSequenceClassification.from_pretrained(model_dir)
model.eval()

sys.stderr.write("[classifier] Model ready. Waiting for requests...\\n")
sys.stderr.flush()

# Signal readiness to the TypeScript server
print(json.dumps({"ready": True}), flush=True)

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        req = json.loads(line)
        text = req.get("text", "")
        inputs = tokenizer(
            text, return_tensors="pt", truncation=True, padding=True, max_length=128
        )
        with torch.no_grad():
            logits = model(**inputs).logits
        pred_id = int(logits.argmax(dim=-1).item())
        label = model.config.id2label[pred_id]
        confidence = round(float(torch.softmax(logits, dim=-1).max().item()), 4)
        print(json.dumps({"label": label, "confidence": confidence}), flush=True)
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
`.trim();

// ─────────────────────────────────────────────
// Classifier process state
// ─────────────────────────────────────────────
let classifierProcess: ChildProcess | null = null;
let modelReady = false;
let stdoutBuffer = "";

// One pending request at a time — resolve/reject when a response arrives
let pending: { resolve: (v: unknown) => void; reject: (e: Error) => void } | null = null;

function startClassifier(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("Starting classifier subprocess...");

    classifierProcess = spawn("python3", ["-c", CLASSIFIER_DAEMON, MODEL_DIR]);

    classifierProcess.stderr?.on("data", (data: Buffer) => {
      process.stdout.write(data.toString());
    });

    classifierProcess.stdout?.on("data", (data: Buffer) => {
      stdoutBuffer += data.toString();
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          console.error("[server] Could not parse classifier output:", trimmed);
          continue;
        }

        // First message from the daemon is the readiness signal
        if (!modelReady && parsed.ready) {
          modelReady = true;
          resolve();
          continue;
        }

        // All subsequent messages are classification results
        if (pending) {
          const { resolve: res, reject: rej } = pending;
          pending = null;
          if (parsed.error) {
            rej(new Error(String(parsed.error)));
          } else {
            res(parsed);
          }
        }
      }
    });

    classifierProcess.on("close", (code) => {
      modelReady = false;
      classifierProcess = null;
      if (code !== 0 && !modelReady) {
        reject(new Error(`Classifier process exited with code ${code}`));
      }
    });
  });
}

function classify(text: string): Promise<{ label: string; confidence: number }> {
  return new Promise((resolve, reject) => {
    if (!modelReady || !classifierProcess?.stdin) {
      reject(new Error("Classifier not ready"));
      return;
    }
    if (pending) {
      reject(new Error("Classifier busy — try again"));
      return;
    }
    pending = { resolve: resolve as (v: unknown) => void, reject };
    classifierProcess.stdin.write(JSON.stringify({ text }) + "\n");
  });
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

// GET /health — is the model loaded and ready?
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: modelReady ? "ready" : "loading", model: MODEL_DIR });
});

// POST /classify — classify a piece of feedback text
// Body: { "text": "your feedback here" }
// Returns: { "label": "bug_report", "confidence": 0.94 }
app.post("/classify", async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== "string" || text.trim() === "") {
    res.status(400).json({ error: "Request body must include a non-empty 'text' field." });
    return;
  }

  if (!modelReady) {
    res.status(503).json({ error: "Model is still loading. Try again in a few seconds." });
    return;
  }

  try {
    const result = await classify(text.trim());
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Classification failed";
    res.status(500).json({ error: message });
  }
});

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
startClassifier()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\nClassifier server ready at http://localhost:${PORT}`);
      console.log(`POST http://localhost:${PORT}/classify  { "text": "your feedback here" }`);
      console.log(`GET  http://localhost:${PORT}/health\n`);
    });
  })
  .catch((err) => {
    console.error("\n[server] Failed to start classifier:", err.message);
    console.error("[server] Make sure you've run: python3 training/train.py\n");
    process.exit(1);
  });
