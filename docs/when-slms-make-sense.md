# When Small Language Models Make Sense

This is not a framework. It is a decision rule. One page. By the end you will be able to look at a task and know immediately whether a small fine-tuned model is the right tool — or whether you should just use a general-purpose local LLM like Ollama.

---

## What a model actually is

A model is a function. You give it text in, it gives you a label (or a number, or more text) out.

That's it. There is no magic. A model is just a very large set of numbers that were adjusted, over millions of examples, until the output got closer to the right answer each time. When you run the model, it uses those numbers to make a prediction.

When people say "train a model", they mean: run that adjustment process on your own data so the model gets better at your specific task.

---

## Two types of model, two types of task

**A general-purpose local LLM (like Ollama running tinyllama)** was trained on an enormous amount of text from across the internet. It can answer questions, summarize documents, write code, and have a conversation. It's flexible. It's useful for one-off, open-ended tasks.

**A fine-tuned small model** starts from a smaller base (something that already understands English) and then gets trained specifically on your labeled examples. It becomes very good at one narrow task. It's fast. It's consistent. It runs on a laptop CPU in under a second per prediction.

The tradeoff is simple:

| | Fine-tuned SLM | General LLM (Ollama) |
|---|---|---|
| **Speed** | ~50ms per prediction | ~2–10 seconds per prediction |
| **Consistency** | Same answer every time | Can vary between runs |
| **Requires labeled data** | Yes — you need examples | No |
| **Flexibility** | One task only | Any task |
| **Runs offline** | Yes | Yes |

Neither is better. They're tools for different jobs.

---

## The decision rule

**Fine-tune a small model when:**
1. The task is structured and repetitive — the same kind of input, the same set of possible outputs
2. You have labeled examples — at least 50, ideally 200+
3. Consistency matters — you want the same answer for the same input, every time

**Use a general-purpose LLM (Ollama) when:**
1. The task is open-ended or varies widely
2. You don't have labeled data
3. You need a one-off answer, not a system that runs at scale

---

## Three PM tasks where a fine-tuned SLM wins

### 1. Customer feedback classification

You have 500 support tickets. You want each one tagged: bug report, feature request, pricing concern, onboarding friction, or praise. The categories are fixed. The examples are repetitive. You have historical tickets you've already categorized.

A fine-tuned model will tag them in under a minute, with consistent results. Ollama will take 30+ minutes, and the labels will vary based on how the model is feeling that day.

### 2. Interview transcript extraction

You have 20 user research transcripts and want to extract: the participant's job title, their main pain point, and the product area they mentioned. The structure is always the same. The inputs are always transcripts.

A fine-tuned model learns your extraction schema. It will pull the same fields from every transcript the same way. A general LLM will interpret the task slightly differently each time.

### 3. Document compliance checking

You have product briefs and want to flag ones that are missing a success metric, a target segment, or a risk section. The rules are fixed. The structure is fixed.

A fine-tuned model learns your definition of "complete". Once trained, it checks new docs in milliseconds.

---

## Three PM tasks where you should just use Ollama

### 1. Open-ended synthesis

"Summarize the key themes from these 10 user interviews." There's no single right answer. You want the model to think, not classify. Use Ollama.

### 2. One-off analysis

"I have a strategy doc — does the positioning hold up?" This is a one-time question. You don't have labeled examples. You don't need a system. Use Ollama.

### 3. Tasks where you don't have labeled data

If you can't point to 50+ examples where you already know the right answer, you can't fine-tune yet. The model has nothing to learn from. Use Ollama until you have the data.

---

## A worked example: the feedback classifier

Here is exactly what happens when you run the classifier you'll build in this tutorial.

**Input:**

```
"The onboarding flow is confusing. I couldn't figure out how to connect my data source."
```

**What the model sees internally:**

The text gets broken into tokens (roughly: words and punctuation). The model runs each token through its network of numbers and produces a score for each of the five categories. The category with the highest score wins.

**Output:**

```json
{ "label": "onboarding_friction", "confidence": 0.94 }
```

**Why it's consistent:**

The model was trained on 200 examples of labeled feedback. It saw dozens of onboarding complaints and learned what language patterns predict that label. Every time it sees similar language, it makes the same call — not because it's "thinking", but because the numbers always produce the same output for similar input.

Run the same text through Ollama and it will probably say "onboarding issue" or "UX friction" or "usability problem" — all reasonable, all inconsistent with each other, none of them your controlled label set.

---

## When NOT to use a fine-tuned SLM

**When your categories aren't stable yet.** If you're still debating whether "pricing concern" and "budget constraint" are the same label, don't train yet. The model learns your labels. If the labels change, you retrain.

**When you have fewer than 50 examples per category.** The model will memorize the examples instead of learning the pattern. You'll get good accuracy on training data and bad accuracy on new inputs.

**When you need to explain the decision.** A model gives you a label and a confidence score. It cannot tell you *why* it made that call in terms a human can audit. If your process requires a human-readable rationale, use Ollama and ask it to explain.

**When the task changes frequently.** Fine-tuning is cheap to run but takes time to set up. If your categories shift every month, the maintenance overhead adds up. General-purpose LLMs are more forgiving of shifting requirements.

---

## The one sentence version

Fine-tune a small model when you have a structured, repetitive task with labeled examples and you need speed and consistency at scale. Use Ollama for everything else.
