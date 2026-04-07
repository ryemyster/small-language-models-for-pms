# Small Language Models for PMs

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

You will build a small language model, train it on real data, and call it from TypeScript. No ML background needed. No fluff.

By the end you will be able to answer these from experience — not from reading about it:

- What a model actually is
- When fine-tuning beats prompting (and when it doesn't)
- How to evaluate your model honestly, including where it fails
- How a trained model fits into a normal TypeScript codebase
- What it costs to run at scale vs. a general-purpose local LLM

---

## What we're building

A customer feedback classifier. You give it a support ticket or NPS comment, it returns a category: `bug_report`, `feature_request`, `pricing_concern`, `onboarding_friction`, or `praise`.

This is the textbook case for fine-tuning a small model. The task is structured, repetitive, and you have labeled examples. Those three conditions are the decision rule — and you'll see exactly why by the end.

---

## What's in this repo

```text
training/
  data/feedback.csv     # ~200 labeled feedback examples (synthetic)
  train.py              # fine-tune the model — the only Python in the repo
  model/                # saved model artifact (generated, not committed)

src/
  server.ts             # Express server that serves the model as an endpoint
  classify.ts           # client — call the endpoint, get a label back
  compare.ts            # side-by-side: fine-tuned model vs. Ollama

docs/
  when-slms-make-sense.md   # when to fine-tune vs. just use a local LLM

README.md               # you are here
requirements.txt        # Python dependencies
package.json            # Node dependencies
```

---

## Setup

You will need Python 3.10+, Node 20+, and [Ollama](https://ollama.com) installed.

**Install Python dependencies:**

```bash
pip install -r requirements.txt
```

This installs the libraries needed to fine-tune and run the model.

**Install Node dependencies:**

```bash
npm install
```

This installs Express and the TypeScript tooling for the classifier.

**Pull the Ollama model for comparison:**

```bash
ollama pull llama3
```

This downloads a local general-purpose LLM — we'll compare it against our fine-tuned model later.

---

## Run it

**1. Train the model** (~20 minutes on a laptop CPU):

```bash
python training/train.py
```

This fine-tunes a small pretrained model on the feedback data and saves it to `training/model/`.

**2. Start the classifier server:**

```bash
npm run start
```

This starts a local endpoint at `http://localhost:3000/classify`.

**3. Classify some feedback:**

```bash
npm run classify
```

This sends example feedback to the endpoint and prints the label and confidence score.

**4. Compare against Ollama:**

```bash
npm run compare
```

This runs the same 20 examples through both your fine-tuned model and Ollama and prints a side-by-side table — accuracy, speed, and where each approach wins.

---

## Want to use your own data?

Open `training/train.py`. At the top you'll find three constants. Change those, re-run, done.

---

## Anti-goals

This is not a course. It is not a framework. It is not an opinion piece about how AI will change product management.

It is a working tutorial that opens the black box.

---

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Keep the tone: plain language, honest about tradeoffs, no hype.

## License

[Apache 2.0](LICENSE)
