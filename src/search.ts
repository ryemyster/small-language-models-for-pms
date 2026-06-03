/**
 * search.ts — Find semantically similar feedback using vector search.
 *
 * This is the query side of the pipeline:
 *   1. Take a plain-English question or phrase
 *   2. Convert it to an embedding (768 numbers) via Ollama
 *   3. Ask Supabase: "what stored feedback is nearest to this location?"
 *   4. Return the most similar feedback, ranked by similarity
 *
 * The key insight: you're not searching for words, you're searching for meaning.
 * "Users are confused at signup" will surface feedback that says "couldn't figure
 * out how to get started" — even if none of those words appear in your query.
 *
 * Run it with: npm run search
 * (Ollama must be running with nomic-embed-text: ollama pull nomic-embed-text)
 *
 * Environment variables required (.env file):
 *   SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_ANON_KEY=your-anon-key
 */

import { createClient } from "@supabase/supabase-js";

const OLLAMA_URL = "http://localhost:11434/api/embeddings";
const OLLAMA_EMBED_MODEL = "nomic-embed-text";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[search] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

interface SearchResult {
  id: number;
  text: string;
  label: string;
  confidence: number;
  similarity: number;
}

async function search(
  query: string,
  options: { matchCount?: number; filterLabel?: string } = {}
): Promise<SearchResult[]> {
  const { matchCount = 5, filterLabel } = options;
  const queryEmbedding = await embed(query);

  const { data, error } = await supabase.rpc("search_feedback", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    filter_label: filterLabel ?? null,
  });

  if (error) throw new Error(`Supabase search error: ${error.message}`);
  return data as SearchResult[];
}

// ─────────────────────────────────────────────
// Run some example searches
// ─────────────────────────────────────────────
async function main() {
  const queries = [
    { query: "users getting stuck during setup", label: undefined },
    { query: "too expensive for small teams", label: "pricing_concern" },
    { query: "something is broken in the product", label: "bug_report" },
  ];

  for (const { query, label } of queries) {
    console.log(`\nQuery: "${query}"${label ? ` (filtered to: ${label})` : ""}`);
    console.log("─".repeat(70));

    try {
      const results = await search(query, { matchCount: 3, filterLabel: label });

      if (results.length === 0) {
        console.log("  No results found. Have you run `npm run store` yet?");
        continue;
      }

      for (const r of results) {
        console.log(`  [${(r.similarity * 100).toFixed(1)}% match] ${r.label}`);
        console.log(`  "${r.text}"`);
        console.log();
      }
    } catch (err) {
      console.error(`  Error: ${err instanceof Error ? err.message : err}`);
    }
  }
}

main();
