/**
 * store.ts — Classify feedback, embed it, and store it in Supabase.
 *
 * This is the ingestion pipeline:
 *   1. Send the feedback text to the classifier → get { label, confidence }
 *   2. Send the feedback text to Ollama → get an embedding (768 numbers)
 *   3. Store all three in Supabase: text, label, confidence, embedding
 *
 * Run it with: npm run store
 * (Classifier server must be running: npm run start)
 * (Ollama must be running with nomic-embed-text: ollama pull nomic-embed-text)
 *
 * Environment variables required (.env file):
 *   SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_ANON_KEY=your-anon-key
 */

import { createClient } from "@supabase/supabase-js";

const CLASSIFIER_URL = "http://localhost:3000/classify";
const OLLAMA_URL = "http://localhost:11434/api/embeddings";
const OLLAMA_EMBED_MODEL = "nomic-embed-text";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[store] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
  console.error("[store] Add them to a .env file in the project root.");
  process.exit(1);
}

// The anon key is safe here — this runs server-side only, and RLS controls table access.
// Never use the service_role key in any code that could be exposed to a browser.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────
// Step 1: Classify the text
// ─────────────────────────────────────────────
async function classify(text: string): Promise<{ label: string; confidence: number }> {
  const res = await fetch(CLASSIFIER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Classifier error: ${res.status}`);
  return res.json() as Promise<{ label: string; confidence: number }>;
}

// ─────────────────────────────────────────────
// Step 2: Embed the text
//
// Ollama's embedding model converts text into a list of 768 numbers.
// These numbers represent the text's "location" on a meaning map.
// ─────────────────────────────────────────────
async function embed(text: string): Promise<number[]> {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, prompt: text }),
  });
  if (!res.ok) throw new Error(`Ollama embedding error: ${res.status}`);
  const data = await res.json() as { embedding: number[] };
  return data.embedding;
}

// ─────────────────────────────────────────────
// Step 3: Store in Supabase
// ─────────────────────────────────────────────
async function store(
  text: string,
  label: string,
  confidence: number,
  embedding: number[]
): Promise<void> {
  const { error } = await supabase.from("feedback").insert({
    text,
    label,
    confidence,
    embedding,
  });
  if (error) throw new Error(`Supabase insert error: ${error.message}`);
}

// ─────────────────────────────────────────────
// Run the full pipeline on some example feedback
// ─────────────────────────────────────────────
const EXAMPLES = [
  "The export keeps failing when I try to download more than 500 rows.",
  "I'd love a way to schedule reports to send automatically on Monday mornings.",
  "Your per-seat pricing doesn't work for our team — we have seasonal fluctuations.",
  "I couldn't figure out how to invite my team after signing up. Gave up after 10 minutes.",
  "This is genuinely the best tool I've found for tracking customer feedback across channels.",
  "The search bar isn't returning recent results — anything from the past 24 hours is missing.",
  "Can you add a dark mode? My eyes hurt using this late at night.",
  "We'd switch to an annual plan if the discount was more than 5%.",
];

async function main() {
  console.log(`Ingesting ${EXAMPLES.length} feedback examples...\n`);

  for (const text of EXAMPLES) {
    process.stdout.write(`  Processing: "${text.slice(0, 50)}..."  `);
    try {
      const { label, confidence } = await classify(text);
      const embedding = await embed(text);
      await store(text, label, confidence, embedding);
      console.log(`→ ${label} (${(confidence * 100).toFixed(1)}%)`);
    } catch (err) {
      console.error(`\n  Error: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log("\nDone. Check your Supabase table at the dashboard.");
}

main();
