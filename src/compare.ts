/**
 * compare.ts — Fine-tuned SLM vs. Ollama, side by side.
 *
 * This script runs the same 20 feedback examples through both models
 * and prints a comparison table showing:
 *   - What each model predicted
 *   - Whether they agreed
 *   - How long each took
 *   - Projected throughput at scale
 *
 * Both models run locally. No API keys. No external services.
 *
 * Run it with: npm run compare
 * (Make sure the classifier server is running first: npm run start)
 * (Make sure Ollama is running and llama3 is installed: ollama pull llama3)
 */

const CLASSIFIER_URL = "http://localhost:3000/classify";
const OLLAMA_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = "llama3";

// ─────────────────────────────────────────────
// The 20 test examples — one from each category pattern
// These are NOT in the training data
// ─────────────────────────────────────────────
const TEST_EXAMPLES = [
  // Bug reports
  { text: "The app freezes every time I switch between projects.", expected: "bug_report" },
  { text: "My exports are failing silently — no error message, just nothing.", expected: "bug_report" },
  { text: "Login stopped working after the update this morning.", expected: "bug_report" },
  { text: "The graph is showing data from last week, not this week.", expected: "bug_report" },
  // Feature requests
  { text: "I'd love to be able to assign tasks to multiple people at once.", expected: "feature_request" },
  { text: "Can you add a way to export directly to Google Sheets?", expected: "feature_request" },
  { text: "A weekly summary email would save me a lot of time.", expected: "feature_request" },
  { text: "Please add a dark mode — it's hard on my eyes.", expected: "feature_request" },
  // Pricing concerns
  { text: "Your cheapest plan is still too expensive for a solo operator.", expected: "pricing_concern" },
  { text: "I don't understand why I'm being charged for inactive users.", expected: "pricing_concern" },
  { text: "Competitors offer a free tier. You used to as well.", expected: "pricing_concern" },
  { text: "I need the Pro features but can't justify the price jump from Basic.", expected: "pricing_concern" },
  // Onboarding friction
  { text: "I signed up but couldn't figure out how to connect my data source.", expected: "onboarding_friction" },
  { text: "The getting started guide references a button that doesn't exist in the UI.", expected: "onboarding_friction" },
  { text: "I spent 30 minutes setting up an integration that turned out to be on a higher plan.", expected: "onboarding_friction" },
  { text: "The welcome email links to the wrong page.", expected: "onboarding_friction" },
  // Praise
  { text: "Best tool I've found for this workflow. My whole team is using it.", expected: "praise" },
  { text: "Your support team replied in 10 minutes and actually solved the problem.", expected: "praise" },
  { text: "The new dashboard is a massive improvement over the old one.", expected: "praise" },
  { text: "I've recommended this to three people this week.", expected: "praise" },
];

// ─────────────────────────────────────────────
// Call the fine-tuned classifier
// ─────────────────────────────────────────────
async function callSLM(text: string): Promise<{ label: string; latencyMs: number }> {
  const start = Date.now();
  const response = await fetch(CLASSIFIER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`SLM returned ${response.status}`);
  }

  const result = await response.json() as { label: string; confidence: number };
  return { label: result.label, latencyMs: Date.now() - start };
}

// ─────────────────────────────────────────────
// Call Ollama with a structured prompt
// We ask it to return exactly one of the five category labels.
// Consistency is the main challenge here — Ollama may rephrase or use
// different formatting on each call.
// ─────────────────────────────────────────────
async function callOllama(text: string): Promise<{ label: string; latencyMs: number }> {
  const VALID_LABELS = ["bug_report", "feature_request", "pricing_concern", "onboarding_friction", "praise"];

  const prompt = `Classify the following customer feedback into exactly one of these categories:
bug_report, feature_request, pricing_concern, onboarding_friction, praise

Rules:
- Reply with ONLY the category label, nothing else
- Use underscores, not spaces
- Do not explain your answer

Feedback: "${text}"

Category:`;

  const start = Date.now();
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0 },  // temperature=0 makes Ollama more deterministic
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}`);
  }

  const result = await response.json() as { response: string };
  const latencyMs = Date.now() - start;

  // Extract the label from Ollama's response — it may include extra whitespace or punctuation
  const raw = result.response.trim().toLowerCase().replace(/[^a-z_]/g, "");
  const label = VALID_LABELS.find((l) => raw.includes(l)) ?? raw;

  return { label, latencyMs };
}

// ─────────────────────────────────────────────
// Print the results table
// ─────────────────────────────────────────────
function printTable(
  results: Array<{
    text: string;
    expected: string;
    slmLabel: string;
    slmMs: number;
    ollamaLabel: string;
    ollamaMs: number;
  }>
) {
  const COL = {
    text: 45,
    expected: 22,
    slm: 22,
    ollama: 22,
    match: 7,
  };

  const pad = (s: string, n: number) => s.slice(0, n).padEnd(n);
  const header =
    pad("Feedback", COL.text) +
    pad("Expected", COL.expected) +
    pad("SLM", COL.slm) +
    pad("Ollama", COL.ollama) +
    "Match?";

  const divider = "─".repeat(header.length);

  console.log("\n" + divider);
  console.log(header);
  console.log(divider);

  let slmCorrect = 0;
  let ollamaCorrect = 0;

  for (const r of results) {
    const slmRight = r.slmLabel === r.expected;
    const ollamaRight = r.ollamaLabel === r.expected;
    if (slmRight) slmCorrect++;
    if (ollamaRight) ollamaCorrect++;

    const matchMark = slmRight === ollamaRight ? "  tie" : slmRight ? "  SLM" : "  LLM";
    const row =
      pad(r.text, COL.text) +
      pad(r.expected, COL.expected) +
      pad(r.slmLabel + (slmRight ? "" : " ✗"), COL.slm) +
      pad(r.ollamaLabel + (ollamaRight ? "" : " ✗"), COL.ollama) +
      matchMark;
    console.log(row);
  }

  console.log(divider);

  const n = results.length;
  console.log(`\nAccuracy — SLM: ${slmCorrect}/${n} (${Math.round((slmCorrect / n) * 100)}%)   Ollama: ${ollamaCorrect}/${n} (${Math.round((ollamaCorrect / n) * 100)}%)`);
}

// ─────────────────────────────────────────────
// Print the speed and cost section
// ─────────────────────────────────────────────
function printSpeedSummary(slmTimes: number[], ollamaTimes: number[]) {
  const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  const slmAvg = avg(slmTimes);
  const ollamaAvg = avg(ollamaTimes);

  console.log("\n── Speed ──────────────────────────────────────────────");
  console.log(`SLM average latency:    ${slmAvg}ms per prediction`);
  console.log(`Ollama average latency: ${ollamaAvg}ms per prediction`);

  const VOLUMES = [1_000, 10_000, 100_000];

  console.log("\n── Projected time to classify N items (sequential) ────");
  console.log(`${"Volume".padEnd(12)} ${"SLM".padEnd(16)} Ollama`);
  console.log("─".repeat(46));

  for (const vol of VOLUMES) {
    const slmSec = (vol * slmAvg) / 1000;
    const ollamaSec = (vol * ollamaAvg) / 1000;
    const fmt = (s: number) =>
      s < 60
        ? `${Math.round(s)}s`
        : s < 3600
        ? `${Math.round(s / 60)}min`
        : `${(s / 3600).toFixed(1)}hr`;

    console.log(`${String(vol.toLocaleString()).padEnd(12)} ${fmt(slmSec).padEnd(16)} ${fmt(ollamaSec)}`);
  }

  console.log("\n── What this means ────────────────────────────────────");
  console.log("The fine-tuned SLM is faster because it does one specific thing.");
  console.log("Ollama generates tokens one at a time — more flexible, more expensive per call.");
  console.log("At 10k+ items/day, the latency difference becomes meaningful.");
  console.log("At small volumes, either approach works.");
  console.log("\nBoth run locally. Neither sends data anywhere. Neither costs money per call.");
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  console.log("Running 20 examples through both models...");
  console.log("This will take a few minutes — Ollama generates responses one at a time.\n");

  const results = [];
  const slmTimes: number[] = [];
  const ollamaTimes: number[] = [];

  for (let i = 0; i < TEST_EXAMPLES.length; i++) {
    const { text, expected } = TEST_EXAMPLES[i];
    process.stdout.write(`[${i + 1}/${TEST_EXAMPLES.length}] ${text.slice(0, 40)}...\r`);

    let slmLabel = "error";
    let slmMs = 0;
    let ollamaLabel = "error";
    let ollamaMs = 0;

    try {
      const slm = await callSLM(text);
      slmLabel = slm.label;
      slmMs = slm.latencyMs;
      slmTimes.push(slmMs);
    } catch (err) {
      if (err instanceof Error && err.message.includes("ECONNREFUSED")) {
        console.error("\nCannot connect to the classifier server.");
        console.error("Start it first with: npm run start");
        process.exit(1);
      }
      slmLabel = "error";
    }

    try {
      const ollama = await callOllama(text);
      ollamaLabel = ollama.label;
      ollamaMs = ollama.latencyMs;
      ollamaTimes.push(ollamaMs);
    } catch (err) {
      if (err instanceof Error && err.message.includes("ECONNREFUSED")) {
        console.error("\nCannot connect to Ollama.");
        console.error("Make sure Ollama is running: ollama serve");
        console.error("And llama3 is installed: ollama pull llama3");
        process.exit(1);
      }
      ollamaLabel = "error";
    }

    results.push({ text, expected, slmLabel, slmMs, ollamaLabel, ollamaMs });
  }

  process.stdout.write("\n");
  printTable(results);
  if (slmTimes.length > 0 && ollamaTimes.length > 0) {
    printSpeedSummary(slmTimes, ollamaTimes);
  }

  console.log("\n── Takeaway ───────────────────────────────────────────");
  console.log("Use a fine-tuned SLM when: fixed categories, labeled data, speed matters.");
  console.log("Use Ollama when: open-ended tasks, no labeled data, one-off questions.");
}

main();
