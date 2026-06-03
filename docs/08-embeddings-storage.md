# Chapter 08 — Optional: Store Results with Embeddings and Supabase

**This chapter is optional.** The core tutorial is complete after Chapter 07. The model works, it serves predictions, and you can call it from any script.

This chapter adds a layer on top: persistent storage and semantic search — the ability to ask "find me feedback similar to this" without knowing the exact words. Skip it if you want to stay focused on the SLM itself. Come back to it when you want to build a real workflow around the model.

---

## Before you start

**Your working folder for this chapter:** `chapters/08-embeddings-storage/`

Open your terminal and navigate there:

```bash
cd chapters/08-embeddings-storage
```

**✓ Confirm you're in the right place:**

```bash
ls src/
```

You should see:

```
classify.ts   compare.ts   search.ts   server.ts   store.ts
```

The two new files — `store.ts` and `search.ts` — are what this chapter is about.

**You need the classifier server running.** Open a second terminal, navigate to this chapter folder, and start it:

```bash
npm run start
```

Wait for "Model ready" before continuing.

**You also need Ollama running** with the embedding model:

```bash
ollama pull nomic-embed-text
```

**✓ If it downloads successfully**, you'll see a progress bar, then `success`.

---

**What you'll do in this chapter:**
- Set up a Supabase database to store classified feedback
- Run the ingestion pipeline: classify → embed → store
- Search your stored feedback by meaning, not keywords
- Understand when to use labels vs. embeddings for different types of questions

**What you'll have when you're done:**
- A database of classified, searchable feedback history
- The ability to ask "find me feedback similar to this" without writing SQL

---

## What you're adding

Right now, every classification runs and the result disappears. Nothing is stored. This chapter builds the layer that persists results:

```
New feedback
  → POST /classify → { label, confidence }       ← already works
  → Ollama embedding → 768 numbers               ← new
  → Supabase stores text + label + embedding      ← new
  → semantic search finds related feedback        ← new
```

After this chapter, you'll be able to run a query like:

> "Find me feedback similar to 'users getting stuck at signup'"

...and get back the most semantically similar tickets from your stored history — even if they use completely different words.

---

## What an embedding is — in plain English

Imagine every piece of text gets assigned a location on a giant map. The map has 768 dimensions (not 2 like a regular map, but the idea is the same). Text with similar *meaning* ends up at nearby locations.

These two sentences land very close on the map:
- "The app crashed when I tried to export"
- "I keep getting an error on the export button"

These two land far apart:
- "The app crashed when I tried to export"
- "Your pricing is too expensive for a small team"

The 768 numbers describing a text's location are called an **embedding**. Generating an embedding is what Ollama's `nomic-embed-text` model does — it reads text and returns 768 numbers that place it on the meaning map.

**Labels vs. embeddings — when to use which:**

| | Label | Embedding |
|---|---|---|
| **What it is** | One word (`bug_report`) | 768 numbers |
| **What it does** | Puts feedback in a bucket | Places feedback on a meaning map |
| **Good for** | "How many bug reports this week?" | "Find feedback similar to this complaint" |
| **Requires** | Training on your categories | No training — any text works |

Labels and embeddings complement each other. Labels answer structured questions ("how many pricing complaints?"). Embeddings answer open-ended questions ("what else is similar to this churning customer's message?").

---

## Step 1 — Create a Supabase project

**Open [supabase.com](https://supabase.com) in your browser and create a free account** if you don't have one.

1. Click "New project"
2. Choose a name (anything works — try "feedback-classifier")
3. Choose a region close to you
4. Set a database password and save it somewhere safe
5. Click "Create new project" and wait about 2 minutes for it to set up

**✓ When your project is ready**, you'll see a dashboard with your project name at the top.

---

## Step 2 — Get your credentials

**In the Supabase dashboard, click "Project Settings" in the left sidebar, then "API".**

You need two values:
- **Project URL** — looks like `https://abcdefgh.supabase.co`
- **Anon key** — a long string starting with `eyJ...`

**Open `chapters/08-embeddings-storage/` in your file explorer.**

Create a new file called `.env` (exactly that name, with the dot at the start). Add these two lines:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual URL and key. Save the file.

**✓ The `.env` file is gitignored** — it won't be committed. Your credentials stay local.

> [!NOTE]
> **Use the anon key, not the service_role key.** The anon key is designed for server-side code with Row Level Security (RLS) controlling what it can access. The service_role key bypasses all security rules — never use it in code that could be exposed or committed.

---

## Step 3 — Create the database table

**In the Supabase dashboard, click "SQL Editor" in the left sidebar.**

**Open `chapters/08-embeddings-storage/supabase/migrations/20240101000000_feedback_vectors.sql` in your text editor.**

Copy the entire contents of that file. Paste it into the Supabase SQL editor. Click "Run".

**✓ If it worked**, you'll see "Success. No rows returned."

**Verify the table exists:**

```sql
select * from public.feedback limit 5;
```

**✓ You should see an empty table** with columns: `id`, `text`, `label`, `confidence`, `embedding`, `created_at`.

**✗ If you see an error mentioning `vector`**, the pgvector extension didn't enable. Run this first, then re-run the migration:

```sql
create extension if not exists vector with schema extensions;
```

---

## Step 4 — Open the ingestion script

**Open `chapters/08-embeddings-storage/src/store.ts` in your text editor.**

Scan through it. You'll see an `EXAMPLES` array near the top — 8 feedback examples that will flow through the full pipeline. You can replace these with your own text later.

Now run the ingestion:

```bash
npm run store
```

**✓ You should see:**

```
Ingesting 8 feedback examples...

  Processing: "The export keeps failing when I try to download more..."  → bug_report (91.2%)
  Processing: "I'd love a way to schedule reports to send automatical..."  → feature_request (88.7%)
  Processing: "Your per-seat pricing doesn't work for our team — we h..."  → pricing_concern (85.3%)
  ...

Done. Check your Supabase table at the dashboard.
```

**Open your Supabase dashboard → Table Editor → feedback.**

**✓ You should see 8 rows.** The `embedding` column shows `[768 numbers]` — that's the meaning map location for each piece of text.

> [!IMPORTANT]
> **Customer impact:** Every classified ticket now has a permanent record: what it said, how it was labeled, how confident the model was, and where it sits on the meaning map. That history is queryable. You can filter by label, by date, by confidence threshold. You can look back at everything labeled `pricing_concern` in the past 30 days without re-running any scripts.

---

## Step 5 — Search by meaning

**Open `chapters/08-embeddings-storage/src/search.ts` in your text editor.**

Look at the `queries` array near the top. These are the search queries that will run against your stored feedback.

Now run the search:

```bash
npm run search
```

**✓ You should see results like:**

```
Query: "users getting stuck during setup"
──────────────────────────────────────────────────────────────────────
  [93.4% match] onboarding_friction
  "I couldn't figure out how to invite my team after signing up. Gave up after 10 minutes."

  [89.1% match] onboarding_friction
  "I couldn't figure out how to get started. No idea what to do first."


Query: "too expensive for small teams" (filtered to: pricing_concern)
──────────────────────────────────────────────────────────────────────
  [96.7% match] pricing_concern
  "Your per-seat pricing doesn't work for our team — we have seasonal fluctuations."
```

The search found relevant feedback even when the query words don't appear in the results. "Users getting stuck during setup" matched "Gave up after 10 minutes" because both describe the same situation on the meaning map.

> [!NOTE]
> **Your job:** You can now ask questions you didn't anticipate at labeling time. Your five labels answer five specific questions. Semantic search lets you ask any question. "Show me feedback from customers who mentioned competitors." "Find everything that sounds like a churn signal." These don't require new labels — they use the meaning map you've already built.

> [!TIP]
> **Tradeoff:** If you want to know "how many pricing complaints this week?", use labels — count `pricing_concern` rows by date. Fast, exact, structured. If you want to know "what pricing-related feedback is most similar to this churning customer's message?", use embeddings — run a similarity search. Both answers come from the same stored data. The label and the embedding coexist in the same row.

---

## Add your own feedback

**Open `src/store.ts`** and replace the examples in the `EXAMPLES` array with your own text. Then run:

```bash
npm run store
```

Each new run adds to the stored history — the search results improve as the dataset grows.

To search for something specific, **open `src/search.ts`** and update the `queries` array. Or call the function directly in any TypeScript file:

```typescript
const results = await search("customers frustrated with onboarding email", { matchCount: 5 });
```

---

## How the search works under the hood

When you run `npm run search`:

1. Your query text goes to Ollama → returns 768 numbers (the embedding)
2. Those 768 numbers go to Supabase as the `query_embedding` parameter
3. Supabase runs `search_feedback()` — a SQL function that finds stored rows with the *smallest cosine distance* to your query embedding
4. Results come back ranked by similarity (1.0 = identical meaning, 0.0 = completely unrelated)

The HNSW index on the `embedding` column makes this fast even as the dataset grows, without scanning every row.

---

**Next:** [Chapter 09 — Adapt this for your own use case](09-make-it-yours.md)
