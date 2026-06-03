# Chapter 02 — Starting Point

**Read first:** [docs/02-labels-and-training-data.md](../../docs/02-labels-and-training-data.md)

## What's in this folder

| File | Description |
|------|-------------|
| `data/feedback-starter.csv` | Template with one example per label — your starting point |

## What you'll do in this chapter

- Learn what labels and training examples are
- Understand what makes a strong vs. weak example
- Add your own rows to `data/feedback-starter.csv`

The completed version of `data/feedback-starter.csv` — with all 163 labeled examples — is in `chapters/03-train-baseline/data/feedback.csv`. Don't look ahead unless you're stuck.

## Format reminder

```csv
text,label
"Your feedback text here.",label_name
```

Labels must be exactly one of: `bug_report`, `feature_request`, `pricing_concern`, `onboarding_friction`, `praise`
