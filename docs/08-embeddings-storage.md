# Chapter 08 — Optional: Store Results with Embeddings and Supabase

**This chapter is optional.** The core tutorial is complete. The model works, it serves predictions, and you can call it from any script. This chapter adds a layer on top: persistent storage and semantic search — the ability to ask "find me feedback similar to this" without knowing the exact words.

Skip it if you want to stay focused on the SLM itself. Come back to it when you want to build a real workflow around the model.

---

## What you'll add

Right now, every classification runs and the result disappears. Nothing is stored. This chapter builds the layer that persists results:

```
New feedback
  → POST /classify → { label, confidence }        ← already works
  → Ollama embedding → 768 numbers                ← new
  → Supabase stores text + label + embedding       ← new
  → semantic search finds related feedback         ← new
```

After this chapter, you'll be able to run queries like:

> "Find me feedback similar to 'users getting stuck at signup'"

...and get back the most semantically similar tickets from your stored history — even if they use completely different words.

---

## What an embedding is — for a 12-year-old

Imagine every piece of text gets assigned a location on a giant map. The map has 768 dimensions (not 2 like a regular map, but the idea is the same). Text with similar *meaning* ends up at nearby locations.

These two sentences would be very close on the map:
- "The app crashed when I tried to export"
- "I keep getting an error on the export button"

These two would be far apart:
- "The app crashed when I tried to export"
- "Your pricing is too expensive for a small team"

The 768 numbers describing a text's location are called an **embedding**. Generating an embedding is what Ollama's `nomic-embed-text` model does — it reads text and returns 768 numbers that place it on the meaning map.

**Labels vs. embeddings:**

| | Label | Embedding |
|---|---|---|
| **What it is** | One word (`bug_report`) | 768 numbers |
| **What it does** | Puts feedback in a bucket | Places feedback on a meaning map |
| **Good for** | "How many bug reports this week?" | "Find feedback similar to this complaint" |
| **Requires** | Training on your categories | No training — any text works |
| **Loses** | Nuance within a category | Nothing — every text has a unique location |

Labels and embeddings complement each other. Labels answer structured questions ("how many pricing complaints?"). Embeddings answer open-ended questions ("what else is similar to this churning customer's message?").

---

## What a vector store is — for a 12-year-old

A regular database lets you search by exact value: "find rows where label = 'bug_report'". That's useful. But it can't answer "find rows *near* this location on the meaning map."

A **vector store** is a database that understands locations. Supabase with the `pgvector` extension is a regular Postgres database that also knows how to search by embedding — "find the 10 rows whose embeddings are closest to this query embedding."

The search is called **similarity search** or **nearest-neighbour search**. It returns results ranked by how close they are on the meaning map — not by keyword match.

---

## Setup

### 1. Pull the embedding model

```bash
ollama pull nomic-embed-text
```

This is the model that converts text to embeddings. It runs locally — no API key, no external service.

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a free project. You'll need:
- Your project URL (`https://your-project.supabase.co`)
- Your anon key (found in Project Settings → API)

Create a `.env` file in the project root:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Security note:** The anon key is the right key to use here. It's designed for server-side code with Row Level Security (RLS) controlling what it can access. Never use the `service_role` key in any code that could be exposed to a browser or committed to a public repo.

### 3. Run the database migration

Open the Supabase dashboard → SQL Editor → paste the contents of `supabase/migrations/20240101000000_feedback_vectors.sql` → run it.

This creates the feedback table, enables pgvector, sets up the HNSW similarity index, enables RLS, and creates the search function.

You can verify it worked by running this in the SQL editor:

```sql
select * from public.feedback limit 5;
```

It should return an empty table with columns: `id`, `text`, `label`, `confidence`, `embedding`, `created_at`.

---

## Ingest feedback

With the classifier server running (`npm run start`) and Supabase set up:

```bash
npm install        # installs @supabase/supabase-js
npm run store
```

This runs 8 example feedback items through the full pipeline: classify → embed → store.

Output:

```
Ingesting 8 feedback examples...

  Processing: "The export keeps failing when I try to download more..."  → bug_report (91.2%)
  Processing: "I'd love a way to schedule reports to send automatical..."  → feature_request (88.7%)
  Processing: "Your per-seat pricing doesn't work for our team — we h..."  → pricing_concern (85.3%)
  ...

Done. Check your Supabase table at the dashboard.
```

Open your Supabase dashboard → Table Editor → feedback. You'll see the stored rows. The `embedding` column will show `[768 numbers]` — that's the meaning map location for each piece of text.

> [!NOTE]
> **Your job:** Every classified ticket now has a permanent record: what it said, how it was labeled, how confident the model was, and where it sits on the meaning map. That history is queryable. You can filter by label, by date, by confidence threshold. You can look back at everything the model labeled as `pricing_concern` in the past 30 days without re-running any scripts.

> [!IMPORTANT]
> **Customer impact:** Stored results mean patterns become visible over time. If `onboarding_friction` tickets spike after a product release, that shows up in your stored history. Without persistence, you only know what's happening right now. With it, you can see what changed and when.

---

## Search by meaning

```bash
npm run search
```

Output:

```
Query: "users getting stuck during setup"
──────────────────────────────────────────────────────────────────────
  [93.4% match] onboarding_friction
  "I couldn't figure out how to invite my team after signing up. Gave up after 10 minutes."

  [89.1% match] onboarding_friction
  "I couldn't figure out how to get started. No idea what to do first."

  [71.2% match] onboarding_friction
  "The setup wizard has seven steps. I abandoned it halfway through."


Query: "too expensive for small teams" (filtered to: pricing_concern)
──────────────────────────────────────────────────────────────────────
  [96.7% match] pricing_concern
  "Your per-seat pricing doesn't work for our team — we have seasonal fluctuations."

  [88.3% match] pricing_concern
  "We're a team of 2. The minimum seat count of 5 makes this unaffordable."
```

The search found relevant feedback even when the query words don't appear in the results. "Users getting stuck during setup" matched "Gave up after 10 minutes" because both describe the same situation on the meaning map.

> [!NOTE]
> **Your job:** You can now ask questions you didn't anticipate at labeling time. Your five labels answer five specific questions. Semantic search lets you ask any question. "Show me feedback from customers who mentioned competitors." "Find everything that sounds like a churn signal." "What does our praise feedback have in common?" These don't require new labels — they use the meaning map you've already built.

> [!TIP]
> **Tradeoff:** If you want to know "how many pricing complaints this week?", use labels — count `pricing_concern` rows by date. Fast, exact, structured. If you want to know "what pricing-related feedback is most similar to this churning customer's message?", use embeddings — run a similarity search with the customer's message as the query. You'll find semantically similar tickets regardless of label. Both answers come from the same stored data. The label and the embedding coexist in the same row.

> [!IMPORTANT]
> **Customer impact:** Without semantic search, you only find the feedback you know to look for. A customer describes churn intent without using the word "cancel" — keyword search misses it, but semantic search finds it, because "we're evaluating alternatives" and "considering cancelling" are nearby on the meaning map. The customer wrote clearly. The tool just needed to listen at the right level.

---

## How the search works internally

When you run `npm run search`:

1. Your query text ("users getting stuck during setup") goes to Ollama → returns 768 numbers
2. Those 768 numbers go to Supabase as the `query_embedding` parameter
3. Supabase runs `search_feedback()` — a SQL function that finds the stored rows with the *smallest cosine distance* to your query embedding
4. Results come back ranked by similarity (1.0 = identical meaning, 0.0 = completely unrelated)

The HNSW index on the `embedding` column makes this fast. Without the index, finding the nearest neighbours would require comparing your query against every row. With HNSW, Supabase navigates a graph structure to find near neighbours without scanning everything.

---

## Add your own feedback to search

Edit `src/store.ts` and add your own examples to the `EXAMPLES` array. Run `npm run store` again. Each new ingestion adds to the stored history — the search results improve as the dataset grows.

To search for something specific, edit the `queries` array in `src/search.ts` or call the functions directly:

```typescript
const results = await search("customers frustrated with onboarding email", { matchCount: 5 });
```

---

## What's not covered here

This chapter keeps the implementation minimal. A real production workflow would also include:

- **Deduplication** — detect and skip near-duplicate feedback before storing
- **Scheduled ingestion** — automatically classify and store new tickets as they arrive (via webhook, cron, or queue)
- **Dashboard or reporting** — surface label trends and semantic clusters in a UI
- **Retraining triggers** — flag when stored confidence scores drop, signaling the model may need retraining

These are extensions of the same pattern. The foundation — classify, embed, store, search — is in place.

---

**Next:** [Chapter 09 — Adapt this for your own use case](09-make-it-yours.md)
