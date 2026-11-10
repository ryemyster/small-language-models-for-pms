# Start here (no coding needed)

This is a hands-on tutorial on **small language models**: what they are, how to train one, how to tell whether it actually works, and when one beats a general-purpose AI like ChatGPT. You'll build a real one: a model that reads customer feedback and sorts it into five piles, like bug reports and feature requests. You make the decisions along the way.

**Who it's for:** product managers, and anyone curious about how AI models get built. You don't need a technical background. Everything is explained as you go.

You don't need to know how to code. A **coding agent** does the typing and runs the commands. You make the calls: what the labels mean, what makes a good example, which weakness to fix, and whether the model is good enough to trust.

## The big idea in one minute

A small model trained on your own examples can do one narrow job faster, cheaper, and more consistently than a general AI. You'll see for yourself whether that's true:

1. **Decide the labels.** Five questions you need answered every Monday become five labels.
2. **Train a model** on 163 labeled examples. It takes about a minute.
3. **Test it honestly.** First with a test that looks fine but isn't, then with one you can trust.
4. **Fix its weakest spot** with a dozen targeted examples, and measure whether it worked.
5. **Race it** against a general-purpose AI on the same test, for accuracy and speed.

That's the whole tutorial. The rest is doing it with your own hands.

## What you need

- **A computer:** a Mac with Apple Silicon (M1 or newer), Windows, or Linux. Older Intel Macs won't work: the training library no longer supports them.
- **About 4GB of free disk space** and a decent internet connection for the first setup.
- **A coding agent:** an AI assistant that can open a folder on your computer, read the files, and run commands in it. Claude Code, Cursor, GitHub Copilot, and Codex are examples. Most need an account, and many cost money; some have free plans or trials, so check what's on offer today. If you use one at work, check the rules there first.
- **This repository**, downloaded to your computer (step 1).

**No coding agent?** You can still do the tutorial: [Getting Started](docs/getting_started.md) walks you through every command yourself. The tutorial itself is free. A coding agent just makes it easier.

You don't need an API key or any paid service beyond your coding agent. Everything runs on your computer, and the feedback data in it is made up.

## Step 1: Download the repository

**Easiest:** on the repository's GitHub page, click the green **Code** button, then **Download ZIP**. Unzip it somewhere you'll find it again, such as your Documents folder.

**Or, if you use git:** `git clone https://github.com/ryemyster/small-language-models-for-pms.git`

## Step 2: Open the folder in your coding agent

Open your coding agent and point it at the folder you just unzipped (usually called `small-language-models-for-pms` or `small-language-models-for-pms-main`). In most tools that means **File → Open Folder**, or starting the agent from inside that folder.

## Step 3: Say hi

In your coding agent's chat, type **hi** and press Enter.

Your agent should reply with a short greeting, check your computer, and lead you from there. The folder contains instructions most coding agents read automatically (`AGENTS.md`, plus `CLAUDE.md` for Claude Code), so there's nothing to set up. If the agent asks whether you trust this folder, say yes.

**Using Claude Code in a terminal?** Start it from inside the folder with `claude "hi"` and it greets you right away.

**If your agent doesn't start the tutorial** (some don't read those files automatically), paste this prompt instead:

```text
I want to learn how small AI models work by building one. I don't know how to code.
This folder is a hands-on tutorial called "Small Language Models for PMs".

Please be my tutor:
1. Read TUTOR.md in this folder and follow it. It explains how to guide me.
2. Check that my computer is ready, and help me fix anything that's missing.
3. Then walk me through the tutorial one step at a time, in plain language.

I want to make the decisions myself. You do the typing and run the commands.
Explain what happened, then wait for me before moving on.
```

**Coming back later?** Open the folder again and say hi. The agent checks your notes and offers to pick up where you left off.

## What to expect

- **Your agent will ask before installing anything.** The first time, your computer needs the tutorial's Python packages (about 1.3GB), and later a general-purpose model to compare against (about 1GB). If Python, Node.js, or Ollama are missing, the agent can install them for you, show you how, or wait while you do it.
- **You may be asked to approve commands or file edits.** That's normal. The tutorial's commands only read and write files inside this folder, apart from those downloads. Most agents offer an "allow for this session" option. If you're unsure about something, ask the agent what it does before you approve it.
- **You'll be asked questions.** "How would you label this ticket?" "Which weakness would you fix first?" "Would you trust this label without a person checking it?" There's often no single right answer. The point is to practice the judgment.
- **You guess before you see.** Before each result, your agent asks what you think will happen. Wrong guesses are the point: that's when it clicks.
- **It's split into chapters.** Seven short chapters, about two hours in total. You can stop after any of them. Chapter 08 is optional and the only part that sends data off your computer; your agent will ask first. Chapter 09 helps you apply it to your own work.
- **Your numbers won't exactly match the guide's.** Models start from random numbers, and different computers do the math slightly differently. The pattern is what matters. [Here's why.](docs/getting_started.md#your-numbers-wont-match-ours-exactly--and-thats-expected)
- **You keep notes.** Your agent keeps `my-notes.md` with your guesses, your takeaways, and your decisions. It's yours to keep.

## If you'd rather do it yourself

[Getting Started](docs/getting_started.md) covers setup, then follow the chapters from the [README](README.md) in order.
