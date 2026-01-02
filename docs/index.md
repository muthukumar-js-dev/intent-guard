---
layout: home

hero:
  name: "Intent Guard"
  text: "AI-Native Architecture Validation"
  tagline: Prevent AI coding assistants from breaking your architecture.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/muthu-kumar369/intent-guard

features:
  - title: Layer Boundaries
    details: Enforce strict dependency rules between architectural layers to prevent spaghetti code.
  - title: Protected Regions
    details: Mark specific files or blocks as off-limits to ensure critical logic stays intact.
  - title: AI-Native
    details: Designed specifically to validate changes made by LLM-based coding assistants.
---

## Why Intent Guard?

AI coding assistants are powerful, but they lack architectural context. They often:
- Import internal modules from wrong layers
- Modify core logic that should be immutable
- Introduce circular dependencies

**Intent Guard** acts as a guardrail, running locally or in CI to validate that every code change respects your defined architectural intent.
