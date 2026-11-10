# Small Language Models for PMs

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Monday morning. 340 unread tickets.

It's 9am. Standup is at 10. You need to know:

1. What's broken right now?
2. What are customers asking us to build?
3. Is pricing causing frustration?
4. Where are new users getting stuck?
5. What's already working?

You can't read 340 tickets in an hour. You also can't do this every Monday forever.

**This tutorial builds the thing that does it for you** — a small AI model that reads each ticket and assigns it a category. You train it yourself, on your own examples. It runs on your laptop. No API key. No subscription. No data leaves your machine.

By the end, you type one command and every ticket comes back labeled.

---

## Start here

**What you need:** a Mac with Apple Silicon (M1 or newer), Windows, or Linux, plus [Python 3.11+](https://www.python.org/downloads/), [Node.js 20+](https://nodejs.org), and [Ollama](https://ollama.com). No API key, no account, no GPU. Older Intel Macs won't work: the training library no longer supports them.

**Step 1 — Set up your environment**

→ [Getting Started](docs/getting_started.md) — install Python, Node, and Ollama, then run the setup script. Takes about 30 minutes the first time, mostly downloads.

**Step 2 — Follow the chapters in order**

Each chapter picks up where the last one left off. Don't skip ahead — the story builds on itself.

---

## The chapters

| Chapter | What you'll do | Time |
|---------|----------------|------|
| [01 — Why an SLM?](docs/when-slms-make-sense.md) | Understand why a small trained model beats a general LLM for this job | 10 min read |
| [02 — Labels and training data](docs/02-labels-and-training-data.md) | Turn your five questions into labeled examples the model can study | 20 min |
| [03 — Train a baseline](docs/03-train-baseline.md) | Run your first training pass and read the output | 20 min |
| [04 — Why accuracy lies](docs/04-why-accuracy-lies.md) | See how a good-looking score can still mean a bad model | 15 min |
| [05 — Build a fixed eval suite](docs/05-fixed-eval.md) | Create the honest, repeatable test that anchors everything else | 20 min |
| [06 — Tune deliberately](docs/06-tuning-loop.md) | Improve the weak categories, one change at a time | 30 min |
| [07 — Serve the model](docs/07-serve-the-model.md) | Load the model into a TypeScript endpoint, call it like any API, and race it against a general-purpose model | 25 min |
| [08 — Embeddings and storage](docs/08-embeddings-storage.md) | Store results and search by meaning — optional, but powerful | 30 min |
| [09 — Make it yours](docs/09-make-it-yours.md) | Adapt the full pipeline for your own use case | 20 min |

---

## What you'll have when you're done

- A trained model that classifies support feedback into five categories
- A fixed eval suite that tells you honestly where the model fails
- A TypeScript endpoint you can call from any script or webhook
- The habit of improving a model deliberately — one change, one measurement, one comparison
- A template you can adapt for your next classification problem in an afternoon

---

## Why an SLM? Not ChatGPT?

You have three real options for sorting 340 tickets. Here's when each one wins.

### Option 1: Raw LLM — paste and ask

Open ChatGPT, paste your tickets, ask it to sort them.

**Works for:** One-off questions. You need an answer today and won't need it again in the same form.

**Breaks down:** You can't compare this week's numbers to last week's. The model has no memory of how you defined "onboarding friction" last time. Run the same batch next week and you'll get slightly different labels, different edge-case decisions, different results on tickets that could go either way.

---

### Option 2: LLM with an orchestration layer

Same idea, but engineered. A fixed system prompt defines your categories. Versioned few-shot examples are included in every request. The model returns structured JSON, not prose.

**Works for:** Moderate volume (under ~1,000 tickets/week). Categories that change every few months. Teams comfortable maintaining a prompt-based pipeline.

**Breaks down at scale — specifically:**

- **Cost compounds.** At ~200 tokens per ticket and typical prices for small API models, you're paying roughly $0.0001–$0.0005 per ticket (prices change, so check your provider's current rates). Negligible at 500/week. A real budget line at 50,000/week.
- **Latency is a ceiling.** An API round-trip takes 1–5 seconds per call. A local model takes milliseconds. No rate limits.
- **Your data leaves your system.** Every classification call sends customer ticket text to a third-party API. For companies with data residency requirements or sensitive support data, that's a problem.
- **"An agent that learns" doesn't solve the core tradeoffs.** A memory-augmented agent can get closer to fine-tuned consistency — but it still pays per call, still hits the latency ceiling, still sends data out. It's more engineering for a result a fine-tuned model delivers more simply.

---

### Option 3: Fine-tuned small language model (SLM) — what this tutorial builds

A small model (~250MB) you train on your own labeled examples. After training, it runs locally. No API. No internet. No cost per call.

**An SLM is not a general-purpose AI.** It doesn't know about the world. It knows one thing: how to apply your labels to your kind of text, because that's all you trained it on. That's exactly what you want for this job.

| Use an SLM when | Why |
|-----------------|-----|
| High volume (1,000+ items/week) | Per-call cost compounds; local inference is ~$0 after training |
| Fixed categories that rarely change | Training investment pays off over many runs |
| Data you can't send externally | Everything stays on your machine |
| You need consistent, auditable output | Same input always returns the same label |
| Speed matters | Milliseconds per call, no rate limits |

| Stick with an LLM when | Why |
|------------------------|-----|
| Categories change frequently | Retraining takes time; a prompt update takes minutes |
| You don't have labeled examples | Fine-tuning requires data — without it, you can't train |
| Low volume and cost doesn't matter | Engineering overhead isn't worth it for 50 tickets/week |
| You need a reason, not just a label | An SLM returns a label and confidence score, not an explanation |

**The one-question test:** How often does this task run, on how many items, and can the data leave your system?

- Rarely, small batch, no data concerns → raw LLM
- Regularly, moderate volume, some data concerns → LLM with orchestration
- Regularly, high volume, or data must stay local → fine-tuned SLM

This tutorial builds the third option and compares it directly against a local general-purpose model so you can see the tradeoffs in practice, not just on paper. When we ran that comparison on the tutorial's 100-ticket test set, the general model, given a well-built prompt, scored 82% to the fine-tuned model's 87%. Close overall. But on `onboarding_friction`, the label where your team's definition matters most, it got 10 of 20 right to the fine-tuned model's 16, and it took about 8 times longer per ticket.

→ [When SLMs make sense](docs/when-slms-make-sense.md) — the full one-page decision rule, with worked examples

---

## Quick start (if you just want to see it run)

The chapters walk you through all of this one step at a time. If you'd rather run the finished project first, do this from the project root after installing Python, Node, and Ollama:

```bash
python3 setup.py                     # one time: checks your tools, installs packages into .venv
source .venv/bin/activate            # turn on the environment (Windows: .venv\Scripts\activate)
python3 training/train.py            # train the model — about a minute on a recent laptop
python3 training/score_eval.py --eval training/data/eval.csv   # score it on the 100-ticket fixed eval
npm run start                        # serve it at localhost:3000 — leave this running
```

Then, in a second terminal (from the project root):

```bash
npm run classify                     # send five sample tickets, get labels back
ollama pull qwen2.5:1.5b             # one time: the general model to compare against (~1GB)
npm run compare                      # fine-tuned model vs. general model on the fixed eval
```

Your scores will land within a few points of the ones quoted in the chapters, not exactly on them. [Here's why.](docs/getting_started.md#your-numbers-wont-match-ours-exactly--and-thats-expected)

---

## What's in this repo

```
docs/                ← chapter guides — read these in order
chapters/            ← one working folder per chapter, each with everything it needs
setup.py             ← one-time setup: checks your tools, installs packages into .venv
requirements.txt     ← Python packages (installed by setup.py)
training/            ← the finished project's Python side
  data/              ← feedback.csv (175 labeled examples), eval.csv (fixed eval), bad_eval.csv
  train.py           ← fine-tunes the model
  score_eval.py      ← scores any labeled CSV against your model
  experiment-log.md  ← one row per training run
  model/             ← the trained model (generated by train.py, gitignored)
src/                 ← the finished project's TypeScript side
  server.ts          ← serves the model as an API at localhost:3000
  classify.ts        ← sends text, gets a label back
  compare.ts         ← fine-tuned model vs. a general model on the fixed eval
  store.ts           ← Chapter 08: classify, embed, and save to Supabase
  search.ts          ← Chapter 08: search saved feedback by meaning
supabase/            ← Chapter 08: database table definition
```

The root folder is the finished reference. You do the work inside `chapters/`.

---

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Keep the tone: plain language, honest about tradeoffs, no hype.

## License

[Apache 2.0](LICENSE)
