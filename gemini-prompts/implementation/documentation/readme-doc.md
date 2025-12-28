You are a senior open-source maintainer who has written successful READMEs
for infrastructure-level npm packages (like ESLint, Prettier, Husky).

Your task is to WRITE a complete README.md for an open-source npm package
called `intent-guard`.

This README must be:
- Extremely clear
- Beginner-friendly
- Honest about limitations (MVP)
- Example-driven
- Free of hype and buzzwords

Context:
- `intent-guard` is an npm package that validates AI-generated code
  against developer-defined intent and architectural rules.
- It sits BETWEEN AI IDE output and the codebase.
- It does NOT generate code.
- It does NOT replace tests, linters, or frameworks.

Target Audience:
- JavaScript / TypeScript developers
- Using AI IDEs (Cursor, Copilot, Gemini, etc.)
- Working with Node.js, React, Express, Next.js, etc.

The biggest problem to solve in this README:
> “I don’t understand what this package does, why I need it,
> and how to use it in my project.”

Your README MUST contain the following sections
(in this exact logical order):

------------------------------------------------------------
1. What is intent-guard?
------------------------------------------------------------
- Simple, plain-English explanation
- One-paragraph summary
- One-sentence tagline
- No philosophy, no buzzwords

------------------------------------------------------------
2. The Problem (Why this exists)
------------------------------------------------------------
- Real developer problems with AI-generated code
- Concrete examples (architecture violations, duplicated logic, rule breaking)
- Explain why existing tools (ESLint, tests) are NOT enough

------------------------------------------------------------
3. What intent-guard DOES and DOES NOT do
------------------------------------------------------------
DOES:
- Bullet list of responsibilities

DOES NOT:
- Bullet list of non-goals (very important to reduce confusion)

------------------------------------------------------------
4. How intent-guard Works (Mental Model)
------------------------------------------------------------
Explain using a simple flow:

Developer Intent → AI Generates Code → intent-guard Validates → Result

- Use ASCII diagram if helpful
- Keep it simple
- No internal implementation details here

------------------------------------------------------------
5. Installation
------------------------------------------------------------
- npm / yarn / pnpm install instructions
- Supported Node.js versions (if applicable)

------------------------------------------------------------
6. Quick Start (5-minute setup)
------------------------------------------------------------
This is the MOST IMPORTANT section.

Include:
- How to initialize intent-guard
- What files are created
- Minimal example of an intent file
- One example validation command
- Example output (success + failure)

Make it copy-paste friendly.

------------------------------------------------------------
7. Intent File Explained
------------------------------------------------------------
- What an intent file is
- Why it exists
- Minimal schema explanation
- Example with comments
- Explain how AI IDEs use this file

------------------------------------------------------------
8. CLI Commands
------------------------------------------------------------
For each command:
- What it does
- When to use it
- Example usage
- Example output

------------------------------------------------------------
9. Using intent-guard with AI IDEs
------------------------------------------------------------
- How developers should instruct AI to use intent-guard
- Example AI prompt snippet
- Explain validation feedback loop

------------------------------------------------------------
10. Common Use Cases
------------------------------------------------------------
- Preventing architectural violations
- Enforcing project rules
- Guarding critical modules
- AI code review automation

------------------------------------------------------------
11. Current Limitations (MVP)
------------------------------------------------------------
- Be honest
- What is not supported yet
- What may change

------------------------------------------------------------
12. When you SHOULD NOT use intent-guard
------------------------------------------------------------
- Small scripts
- One-off projects
- Cases where it adds no value

------------------------------------------------------------
13. Roadmap (High-level)
------------------------------------------------------------
- Short bullet points
- No promises
- No timelines

------------------------------------------------------------
14. Contributing
------------------------------------------------------------
- How to contribute
- Code style expectations
- Issue reporting guidance

------------------------------------------------------------
15. License
------------------------------------------------------------
- Mention license 

Rules:
- Write in Markdown
- Use simple language
- Avoid long paragraphs
- Prefer examples over explanations
- No marketing tone
- Assume this README is the ONLY documentation available

Goal:
After reading this README, a developer should be able to:
- Understand exactly what intent-guard is
- Know whether they need it or not
- Install it
- Use it successfully in under 10 minutes
