/**
 * classify.ts — Send feedback text to the classifier and get a label back.
 *
 * This is the client side of the pattern:
 *   server.ts  = the model, running as an endpoint
 *   classify.ts = your code, calling that endpoint
 *
 * This is exactly how you'd integrate the classifier into a real product —
 * a script, a webhook handler, a data pipeline. You call the endpoint,
 * you get a structured result, you do something with it.
 *
 * Run it with: npm run classify
 * (Make sure the server is running first: npm run start)
 */

const SERVER_URL = "http://localhost:3000/classify";

// ─────────────────────────────────────────────
// The classify function
// Takes a string of feedback text, returns { label, confidence }
// ─────────────────────────────────────────────
async function classify(text: string): Promise<{ label: string; confidence: number }> {
  const response = await fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Classifier returned ${response.status}: ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<{ label: string; confidence: number }>;
}

// ─────────────────────────────────────────────
// Example usage — run a few sample inputs and print the results
// ─────────────────────────────────────────────
const examples = [
  "The dashboard crashes every time I try to export to PDF.",
  "It would be great if you could add a Slack integration.",
  "Your pricing is too high for a small startup.",
  "I couldn't figure out how to invite my team after signing up.",
  "This is the best tool I've used for managing customer feedback.",
];

async function main() {
  console.log("Sending examples to the classifier...\n");

  for (const text of examples) {
    try {
      const result = await classify(text);
      console.log(`Text:       ${text}`);
      console.log(`Label:      ${result.label}`);
      console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log("─".repeat(60));
    } catch (err) {
      if (err instanceof Error && err.message.includes("ECONNREFUSED")) {
        console.error("Cannot connect to the classifier server.");
        console.error("Make sure it's running: npm run start");
        process.exit(1);
      }
      console.error(`Error classifying: "${text}"`);
      console.error(err instanceof Error ? err.message : err);
    }
  }
}

main();
