# Small Language Models for PMs

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

## Monday morning

It's Monday. You open your support inbox and there are 340 new tickets from the weekend.

Some are bug reports. Some are feature requests. Some are people confused about pricing. Some are new users who gave up during onboarding and want to explain why. A few are just happy customers saying thanks.

You need to answer five questions before your 10am standup:

1. What's broken right now?
2. What are customers asking us to build?
3. Is pricing causing frustration?
4. Where are new users getting stuck?
5. What's already working?

The honest answer is: you can't. Not in an hour. Not without reading every ticket. And even if you could, you'd have to do it again next Monday. And the Monday after that.

---

## Three options — and when each one wins

You have three real options for this job. Each one is right in a different situation.

---

### Option 1: Raw LLM (paste and ask)

You paste your tickets into ChatGPT or Claude and ask it to sort them.

**When it works:** One-off analysis. You need an answer today and you won't need it again in the same form.

**Where it breaks down:** Consistency. Run the same batch next week and you'll get slightly different results — different label names, different edge-case decisions, different handling of tickets that could go either way. The model has no memory of how you defined "onboarding friction" last week. This matters when you're comparing week-over-week trends, because a change in your numbers might be a real signal or it might be the model interpreting a category differently.

---

### Option 2: LLM with an orchestration layer

This is the engineered version of Option 1. An orchestration layer means: a fixed system prompt that defines your categories precisely, versioned few-shot examples (real tickets you've already labeled, included in every request), and structured output (the model is forced to return JSON, not prose). Done well, this produces consistent results run after run.

**When it works:** You want flexibility without ML infrastructure. Your categories change every few months. You have low-to-moderate volume (under ~1,000 tickets per week). Your engineering team is comfortable maintaining a prompt-based pipeline.

**Where it breaks down — and this is specific:**

- **Cost compounds at scale.** Each classification is an API call. At ~200 tokens per ticket and GPT-4o pricing, you're paying roughly $0.0001–$0.0005 per ticket. That's negligible at 500 tickets/week. At 50,000 tickets/week, it's a real budget line — and you're also paying for the orchestration layer's overhead tokens on every call.
- **Latency is a ceiling, not a floor.** An API round-trip is 1–5 seconds per call. Even with batching and parallelism, you're constrained by rate limits. A local model runs in milliseconds with no rate limit.
- **Your data leaves your system.** Customer support tickets contain names, account details, and complaint specifics. Every classification call sends that data to a third-party API. For many companies, this is fine. For companies with strict data residency requirements, SOC 2 obligations, or sensitive customer data, it's not.
- **An agent that "learns" adds complexity without solving the core tradeoffs.** A memory-augmented agent (one that stores past classifications and retrieves them as context) can get closer to fine-tuned consistency — but it still pays the per-call cost, still hits the latency ceiling, and still sends data out. The retrieval step adds latency and another failure mode. It's more engineering for a result that a fine-tuned model delivers more simply.

---

### Option 3: Fine-tuned small language model (SLM)

**What it is:** A small model (in this tutorial, ~250MB) that you train on your own labeled examples. After training, it runs locally — no API, no internet connection, no cost per call.

**A small language model (SLM)** is not a general-purpose AI. It doesn't know about the world. It knows one thing: how to apply your labels to your type of text, because that's all you trained it on.

**A large language model (LLM)** — the kind behind ChatGPT or Claude — is a generalist trained on most of the text on the internet. That breadth is what makes it useful for open-ended tasks. It's also what makes it overkill (and expensive) for a fixed-label job.

**When an SLM wins:**

| Signal | Why it matters |
|--------|---------------|
| High volume (1,000+ items/week) | Per-call API cost compounds; local inference is ~$0 after training |
| Fixed taxonomy that rarely changes | The upfront training investment pays off over many runs |
| Data you can't send to an external API | Everything stays on your machine |
| Need for deterministic output | Same input always returns the same label — auditable, reproducible |
| Latency or throughput constraints | Milliseconds per call, no rate limits |

**When an SLM loses:**

| Signal | Why it matters |
|--------|---------------|
| Categories change frequently | Retraining takes time; an LLM prompt update takes minutes |
| You don't have labeled examples | Fine-tuning requires data; without it, you can't train |
| Low volume where cost doesn't matter | Engineering overhead isn't worth it for 50 tickets/week |
| You need reasoning or explanation | An SLM returns a label and a confidence score, not a rationale |

---

## The decision in one question

**How often does this task run, on how many items, and can the data leave your system?**

- Rarely, small batch, no data concerns → raw LLM
- Regularly, moderate volume, some data concerns → LLM with orchestration
- Regularly, high volume, or data must stay local → fine-tuned SLM

This tutorial builds the third option and compares it directly against a local LLM (Ollama) so you can see the tradeoffs in practice, not just in theory.

---

## What this is

A build-along tutorial. You will train a real model on real data and call it from TypeScript. No ML background needed.

By the end, you'll be able to answer these from experience — not from reading about it:

- What a model actually is (a function trained on examples, not a black box)
- When fine-tuning beats prompting — and when it doesn't
- How to evaluate your model honestly, including where it fails
- How a trained model fits into a normal TypeScript codebase
- What it costs to run at scale vs. a general-purpose local LLM

Evaluation is not an appendix here. You'll build a fixed eval suite before you tune the model, and use it to measure every change you make. That's the habit that separates a model that works in a demo from one that works in production.

---

## The build-along chapters

| Chapter | What you'll do |
|---------|----------------|
| 01 | Understand the problem — this page |
| [02 — Labels and training data](docs/02-labels-and-training-data.md) | Turn your five questions into labeled examples the model can study |
| [03 — Train a baseline](docs/03-train-baseline.md) | Run your first training pass and understand what the output means |
| [04 — Why accuracy lies](docs/04-why-accuracy-lies.md) | See how a good-looking score can still mean a bad model |
| [05 — Build a fixed eval suite](docs/05-fixed-eval.md) | Create the trustworthy, repeatable test that anchors everything else |
| [06 — Tune deliberately](docs/06-tuning-loop.md) | Improve the weak categories, one change at a time |
| [07 — Serve the model](docs/07-serve-the-model.md) | Load the artifact into a TypeScript endpoint and call it like any API |
| [08 — Optional: embeddings + storage](docs/08-embeddings-storage.md) | Store classified results with vectors for semantic search |
| [09 — Make it yours](docs/09-make-it-yours.md) | Adapt the full pipeline for your own use case, and monitor it in production |

Start with [docs/getting_started.md](docs/getting_started.md) to set up your environment before chapter 02.

---

## What's in this repo

```text
training/
  data/feedback.csv         # ~200 labeled feedback examples (synthetic)
  train.py                  # fine-tune the model — the only Python in the repo
  model/                    # saved model artifact (generated, not committed)

src/
  server.ts                 # Express server that serves the model as an endpoint
  classify.ts               # client — call the endpoint, get a label back
  compare.ts                # side-by-side: fine-tuned model vs. Ollama

docs/
  getting_started.md        # environment setup
  when-slms-make-sense.md   # when to fine-tune vs. just use a local LLM

README.md                   # you are here
requirements.txt            # Python dependencies
package.json                # Node dependencies
```

---

## Quick start

**First time? Run the setup script** — it handles Python deps, Node deps, and checks everything is in place:

```bash
python3 setup.py        # Mac / Linux
python setup.py         # Windows
```

Then train and run:

```bash
python3 training/train.py   # fine-tune the model (~20 min on a laptop CPU)
npm run start               # serve the model at localhost:3000
npm run classify            # send feedback, get a label back
npm run compare             # fine-tuned model vs. Ollama, side by side
```

Full setup guide: [docs/getting_started.md](docs/getting_started.md).

---

## Anti-goals

This is not a course. It is not a framework. It is not an opinion piece about how AI will change product management.

It is a working tutorial that opens the black box.

---

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Keep the tone: plain language, honest about tradeoffs, no hype.

## License

[Apache 2.0](LICENSE)
