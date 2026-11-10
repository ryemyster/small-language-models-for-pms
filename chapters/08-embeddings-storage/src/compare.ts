/**
 * compare.ts — Fine-tuned SLM vs. a general-purpose local LLM, side by side.
 *
 * Both models label the same 100 tickets: the fixed eval from Chapter 05.
 * Same ruler, same tickets, so the comparison is fair. The script prints:
 *   - How many each model got right, label by label
 *   - Tickets where they disagreed
 *   - How long each took per ticket (inference only — both models already loaded)
 *   - Projected time at higher volumes
 *
 * The general model gets the best setup a prompt can give it: the five label
 * definitions from Chapter 02, and Ollama's structured output, which forces the
 * answer to be exactly one of the five labels. That's the "LLM with an
 * orchestration layer" option from the README, done properly.
 *
 * Both models run locally. No API keys. No external services.
 *
 * Run it with: npm run compare
 * (Classifier server must be running: npm run start)
 * (Ollama must be running with the model pulled: ollama pull qwen2.5:1.5b)
 *
 * Try a different general model: OLLAMA_MODEL=qwen2.5:0.5b npm run compare
 */

import fs from "fs";

const CLASSIFIER_URL = "http://localhost:3000/classify";
const OLLAMA_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:1.5b";

const LABELS = ["bug_report", "feature_request", "pricing_concern", "onboarding_friction", "praise"];

// The same five questions from Chapter 02, one line per label.
const LABEL_DEFINITIONS = `bug_report: what's broken right now
feature_request: what customers are asking us to build
pricing_concern: whether pricing is causing frustration
onboarding_friction: where new users are getting stuck
praise: what's already working`;

// ─────────────────────────────────────────────
// Load the fixed eval
// The root project keeps it in training/data/; chapter folders keep it in data/.
// ─────────────────────────────────────────────
const EVAL_PATH = fs.existsSync("training/train.py") ? "training/data/eval.csv" : "data/eval.csv";

function loadEval(): Array<{ text: string; expected: string }> {
  // Every row looks like: "the feedback text",label
  // The label never contains a comma, so split on the last one.
  return fs
    .readFileSync(EVAL_PATH, "utf8")
    .trim()
    .split("\n")
    .slice(1) // skip the header row
    .map((line) => {
      const cut = line.lastIndexOf(",");
      const text = line.slice(0, cut).replace(/^"|"$/g, "").replace(/""/g, '"');
      return { text, expected: line.slice(cut + 1).trim() };
    });
}

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
// Call the general model through Ollama
// `format` is Ollama's structured output: the reply must be JSON matching this
// schema, so the model can only answer with one of the five labels. Without it,
// small general models often reply with a sentence instead of a label.
// ─────────────────────────────────────────────
async function callOllama(text: string): Promise<{ label: string; latencyMs: number }> {
  const prompt = `Classify this customer feedback into exactly one category.

Categories:
${LABEL_DEFINITIONS}

Feedback: "${text}"`;

  const start = Date.now();
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: {
        type: "object",
        properties: { label: { type: "string", enum: LABELS } },
        required: ["label"],
      },
      options: { temperature: 0 }, // temperature=0: same input, same answer
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}: ${await response.text()}`);
  }

  const result = await response.json() as { response: string };
  const label = (JSON.parse(result.response) as { label: string }).label;
  return { label, latencyMs: Date.now() - start };
}

// ─────────────────────────────────────────────
// Print the results: label by label, then disagreements
// ─────────────────────────────────────────────
type Result = { text: string; expected: string; slmLabel: string; ollamaLabel: string };

function printResults(results: Result[]) {
  const n = results.length;
  const right = (rows: Result[], who: "slmLabel" | "ollamaLabel") =>
    rows.filter((r) => r[who] === r.expected).length;

  const divider = "─".repeat(52);
  console.log(`\nFine-tuned SLM vs. ${OLLAMA_MODEL} on the fixed eval (${EVAL_PATH}, ${n} tickets)\n`);
  console.log(`${"Label".padEnd(24)}${"SLM".padEnd(14)}${OLLAMA_MODEL}`);
  console.log(divider);
  for (const label of LABELS) {
    const rows = results.filter((r) => r.expected === label);
    console.log(
      `${label.padEnd(24)}${`${right(rows, "slmLabel")}/${rows.length}`.padEnd(14)}${right(rows, "ollamaLabel")}/${rows.length}`
    );
  }
  console.log(divider);
  const slmTotal = right(results, "slmLabel");
  const ollamaTotal = right(results, "ollamaLabel");
  console.log(
    `${"Overall".padEnd(24)}${`${slmTotal}/${n} (${Math.round((slmTotal / n) * 100)}%)`.padEnd(14)}${ollamaTotal}/${n} (${Math.round((ollamaTotal / n) * 100)}%)`
  );

  const disagreements = results.filter((r) => r.slmLabel !== r.ollamaLabel);
  const SHOW = 6;
  console.log(`\nWhere they disagreed (${disagreements.length} tickets, first ${Math.min(SHOW, disagreements.length)} shown):`);
  for (const r of disagreements.slice(0, SHOW)) {
    const mark = (label: string) => (label === r.expected ? "✓" : "✗");
    console.log(`\n  ${r.text.slice(0, 90)}`);
    console.log(`  Expected: ${r.expected}`);
    console.log(`  SLM:      ${r.slmLabel} ${mark(r.slmLabel)}`);
    console.log(`  LLM:      ${r.ollamaLabel} ${mark(r.ollamaLabel)}`);
  }
}

// ─────────────────────────────────────────────
// Print the speed section
// ─────────────────────────────────────────────
function printSpeedSummary(slmTimes: number[], ollamaTimes: number[]) {
  const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  const slmAvg = avg(slmTimes);
  const ollamaAvg = avg(ollamaTimes);

  console.log("\n── Speed ──────────────────────────────────────────────");
  console.log(`SLM average latency:    ${slmAvg}ms per ticket`);
  console.log(`${OLLAMA_MODEL} average latency: ${ollamaAvg}ms per ticket`);

  const VOLUMES = [1_000, 10_000, 100_000];

  console.log("\n── Projected time to classify N tickets (one at a time) ──");
  console.log(`${"Volume".padEnd(12)} ${"SLM".padEnd(16)} ${OLLAMA_MODEL}`);
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

  console.log("\nBoth run locally. Neither sends data anywhere. Neither costs money per call.");
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  const examples = loadEval();
  console.log(`Running ${examples.length} tickets from ${EVAL_PATH} through both models...`);
  console.log("This takes a minute or two.\n");

  const results: Result[] = [];
  const slmTimes: number[] = [];
  const ollamaTimes: number[] = [];

  for (let i = 0; i < examples.length; i++) {
    const { text, expected } = examples[i];
    process.stdout.write(`[${i + 1}/${examples.length}]\r`);

    let slmLabel = "error";
    let ollamaLabel = "error";

    try {
      const slm = await callSLM(text);
      slmLabel = slm.label;
      slmTimes.push(slm.latencyMs);
    } catch (err) {
      if (err instanceof Error && (err.message.includes("ECONNREFUSED") || err.message.includes("fetch failed"))) {
        console.error("\nCannot connect to the classifier server.");
        console.error("Start it first with: npm run start");
        process.exit(1);
      }
    }

    try {
      const ollama = await callOllama(text);
      ollamaLabel = ollama.label;
      ollamaTimes.push(ollama.latencyMs);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("not found")) {
        console.error(`\nOllama doesn't have ${OLLAMA_MODEL} yet. Download it with:`);
        console.error(`  ollama pull ${OLLAMA_MODEL}`);
        process.exit(1);
      }
      if (message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
        console.error("\nCannot connect to Ollama. Open the Ollama app (or run: ollama serve).");
        process.exit(1);
      }
    }

    results.push({ text, expected, slmLabel, ollamaLabel });
  }

  process.stdout.write("\n");
  printResults(results);
  if (slmTimes.length > 0 && ollamaTimes.length > 0) {
    printSpeedSummary(slmTimes, ollamaTimes);
  }

  console.log("\n── Takeaway ───────────────────────────────────────────");
  console.log("Use a fine-tuned SLM when: fixed categories, labeled data, speed matters.");
  console.log("Use a general LLM when: open-ended tasks, no labeled data, one-off questions.");
}

main();
