# Chapter 07 — Serve the Model as a Local Endpoint

You have a trained, evaluated, and tuned model. It lives as a file on your laptop. Right now, using it requires running a Python script manually and reading terminal output.

That's not how a product works.

This chapter turns the model into a service: an HTTP endpoint that accepts a piece of feedback text and returns a label and confidence score in under a second. Once it's running, any code — a script, a webhook handler, a data pipeline, a Slack bot — can call it the same way it would call any other API.

This is the moment training becomes a product capability.

---

## The real-world pattern

```
Python trains → saves model to disk → TypeScript loads model as a service → everything else calls the endpoint
```

The boundary is intentional. Python is the right tool for ML training — the HuggingFace ecosystem, the data manipulation, the model serialisation are all Python. TypeScript is the right tool for building services your product integrates with — Express, fetch, type safety, npm ecosystem.

The two sides never have to meet directly. The model artifact (`training/model/`) is the handoff. Python writes it. TypeScript serves it.

**What this means for your job:** Once the model is behind an endpoint, it stops being an "ML project" and becomes a service — the same mental model as any API your product depends on. You can version it, monitor it, swap it for a better model without changing the callers, and document it with a simple spec: `POST /classify { text } → { label, confidence }`. That's a product decision, not a technical one.

---

## Start the server

```bash
npm run start
```

You'll see:

```
Starting classifier subprocess...
[classifier] Loading model from disk...
[classifier] Model ready. Waiting for requests...

Classifier server ready at http://localhost:3000
POST http://localhost:3000/classify  { "text": "your feedback here" }
GET  http://localhost:3000/health
```

The key line is "Model ready." That's the Python subprocess confirming the model loaded successfully. **The model loads exactly once** — when the server starts. Every classification request after that goes to the already-loaded model.

**Why model loading happens once:** Loading a 250MB model from disk and initialising it takes 5–15 seconds. If the server loaded the model for every request, each classification would take 5–15 seconds. With the model loaded once at startup, each classification takes under 100ms — the time to run a tokenized input through the network, not the time to read a file.

This is the same reason you don't open a database connection for every query. You open it once, keep it alive, and reuse it.

---

## Classify feedback

With the server running, open a new terminal:

```bash
npm run classify
```

You'll see output like:

```
Text:       The dashboard crashes every time I try to export to PDF.
Label:      bug_report
Confidence: 94.3%
────────────────────────────────────────────────────────────

Text:       It would be great if you could add a Slack integration.
Label:      feature_request
Confidence: 91.7%
────────────────────────────────────────────────────────────
```

Each result arrives in under a second. The model is reading that text, tokenising it, running it through the neural network, and returning the highest-probability label with its confidence score.

**What confidence means:** The model assigns a probability to each of the five labels. Confidence is the probability of the winning label. A 94% confidence on `bug_report` means the model is very sure. A 61% confidence means the text sits close to a category boundary — the model is less certain, and you should weight that result accordingly.

**What this means for your job:** Low-confidence results are flags, not failures. In a real workflow, you'd set a threshold — classify automatically when confidence > 80%, route to human review when it's below. That threshold is a product decision: how much do you trust the model vs. how much do you need a human in the loop?

**The customer impact:** With the model running as a service, classification can happen automatically as tickets arrive — not manually every Monday morning. A `bug_report` filed at 2am on a Sunday reaches the engineering queue before the team starts work Monday morning, not after someone runs a script. Speed of routing is speed of response.

---

## Call the endpoint directly

You don't need `classify.ts` to use the endpoint. Any HTTP request works:

```bash
curl -X POST http://localhost:3000/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "I signed up but had no idea what to do next. Completely lost."}'
```

```json
{ "label": "onboarding_friction", "confidence": 0.8812 }
```

This is the integration point. A webhook that fires when a Zendesk ticket is created can call this endpoint. An NPS survey processor can call this endpoint. A Slack bot that surfaces trending feedback can call this endpoint. The model doesn't care what's calling it — it sees text, returns a label.

---

## Check server health

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ready", "model": "/path/to/training/model" }
```

If the model is still loading, `status` will be `"loading"`. If the server crashed or the model wasn't found, the server won't start at all — you'll see the error in the terminal.

---

## Compare against Ollama

```bash
npm run compare
```

This runs 20 examples through both your fine-tuned model and Ollama and prints a side-by-side table. It takes a few minutes because Ollama generates responses one token at a time.

The latency numbers here are **inference only** — the fine-tuned model's startup cost already happened when you ran `npm run start`. What you're measuring is the time to classify a piece of text once the model is ready.

A typical result:

```
─────────────────────────────────────────────────────────────────────────────────────────────────
Feedback                                      Expected               SLM                    Ollama                 Match?
─────────────────────────────────────────────────────────────────────────────────────────────────
The app freezes every time I switch between   bug_report             bug_report             bug_report               tie
My exports are failing silently — no error    bug_report             bug_report             bug_report               tie
I'd love to assign tasks to multiple people   feature_request        feature_request        feature_request          tie
Your cheapest plan is too expensive for a     pricing_concern        pricing_concern        pricing_concern          tie
I signed up but couldn't connect my data      onboarding_friction    onboarding_friction    bug_report               SLM
...

Accuracy — SLM: 19/20 (95%)   Ollama: 15/20 (75%)

── Speed ──────────────────────────────────────────────
SLM average latency:    45ms per prediction
Ollama average latency: 3200ms per prediction

── Projected time to classify N items (sequential) ────
Volume       SLM              Ollama
──────────────────────────────────────────────────────
1,000        45s              53min
10,000       8min             9hr
100,000      1.2hr            3.7days
```

The fine-tuned model is faster because it does exactly one thing. Ollama generates tokens one at a time, checking each against the full vocabulary — a process designed for flexible open-ended output, not structured classification.

**The tradeoff — this vs. an API:** You could classify with GPT-4o or Claude via API. The results would be comparable on accuracy. The differences:
- **Cost**: API providers charge per token. At 100k classifications, that's a real budget line. Your local model costs $0 per call after training.
- **Latency**: API calls add network round-trip time on top of inference time. Your local model is purely local.
- **Data**: API calls send your customer data to a third party. Your local model never leaves your machine.
- **Control**: You can retrain your model. You can't retrain a provider's model.

**The customer impact:** Every ticket that gets classified correctly reaches the right team faster. The latency difference between a 45ms local classifier and a 3200ms Ollama call matters at scale — not for the first ticket, but for Monday morning's full batch of 340.

---

## What you've built

At this point, the full pipeline exists:

```
Customer writes feedback
  → arrives in your inbox (Zendesk, Slack, NPS, email)
  → POST /classify
  → { label: "onboarding_friction", confidence: 0.88 }
  → routed to the right team
  → your five Monday-morning questions answered automatically
```

The model was trained on examples you labeled. It was evaluated on a fixed suite you designed. It was tuned based on specific failures you diagnosed. And it runs locally, costs nothing per call, and sends no customer data anywhere.

That's the thing you built. Not a black box — a function you understand, trained on data you chose, evaluated with a ruler you designed.

---

## If something goes wrong

**Server won't start — "Model not found"**
Run `python3 training/train.py` first. The model artifact must exist before the server can load it.

**Server starts but /classify returns 503**
The model is still loading. Wait a few seconds and try again. Watch the terminal — it will print "Model ready" when it's ready.

**npm run compare fails with ECONNREFUSED**
The classifier server must be running before you run compare. Open two terminals: `npm run start` in one, `npm run compare` in the other.

**Ollama errors in compare**
Make sure Ollama is running (`ollama serve`) and llama3 is installed (`ollama pull llama3`). If you want to skip the Ollama comparison, the classifier itself is still fully functional.

---

**Next:** [Chapter 08 — Optional: store results with embeddings and Supabase](08-embeddings-storage.md)
