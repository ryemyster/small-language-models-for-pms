# Contributing

Contributions are welcome. This is an open tutorial, not a framework — the goal is to keep it useful for someone with no prior experience.

---

## What we're looking for

- **Clearer explanations** — if something confused you, a PR that improves that section is valuable
- **Bug fixes** — if the code doesn't work as described, fix it
- **Better training data** — more labeled examples that reflect real PM feedback patterns
- **Corrections** — if something is factually wrong, please say so

## What we're not looking for

- New features that expand scope beyond the core use case
- Framework references or jargon
- Hype language of any kind
- Additional model comparisons (the point is one fine-tuned model vs. one small general model — not a benchmark suite)

---

## How to contribute

1. Fork the repo
2. Create a branch: `git checkout -b your-change-description`
3. Make your changes
4. Open a pull request with a clear description of what you changed and why

No formal process. No CLA. Just keep the tone: plain language, honest about tradeoffs, no hype.

**If your change affects what a command prints**, rerun the affected chapters and update the output quoted in the docs. Every score in the guide is real output from a real run, never a made-up example. Your numbers will differ a little from what's there now (different computer), which is fine: replace the numbers in the chapters you touched, and check that the story around them still holds.

---

## Tone standard

Every piece of writing in this repo is held to the same standard:

- Assume zero prior knowledge — explain every term the first time it appears
- Every terminal command gets a plain-English sentence before it
- Every terminal command gets "you should see something like:" after it
- No walls of text
- Direct, not hedged

If you're unsure whether something fits, open an issue and ask.

---

## Reporting issues

Open a GitHub issue. Include:
- What you were trying to do
- What you expected to happen
- What actually happened
- Your OS, Python version, and Node version if relevant
