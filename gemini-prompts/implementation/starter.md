You are a senior JavaScript platform architect and npm ecosystem designer.

Your task is to PLAN (not yet code) a high-value npm package that solves real problems faced by JavaScript developers in the era of AI-driven development (AI IDEs, code generation, agents).

Context:
- Modern JS developers increasingly rely on AI IDEs to generate 70–90% of code.
- AI generates syntactically correct code, but often violates:
  - architectural intent
  - domain rules
  - implicit constraints
  - duplication at the semantic level
- Current JS frameworks (React, Express, Nest, etc.) and npm packages do NOT provide:
  1. Machine-readable developer intent
  2. Global architectural memory
  3. Meaning-level duplication detection
- npm packages are the ONLY universal layer usable across all JS frameworks and AI IDEs.

Identified Gaps:
Gap 1: No “Intent Lock” in codebases  
→ Code does not carry explicit, machine-readable intent that AI must obey.

Gap 2: No Global Architectural Memory  
→ No single source of truth describing system rules, invariants, and boundaries.

Gap 3: Duplication is Invisible at Meaning Level  
→ Same logic is re-implemented with different names and structures.

Core Philosophy:
Constraints → AI → Verified Output

The npm package should:
- Sit BETWEEN AI-generated code and the actual codebase
- Validate AI output against explicit developer-defined intent and rules
- Fail fast, explain violations, and guide correction
- Be framework-agnostic (works with Node.js, React, Next.js, Express, etc.)
- Be usable via CLI and AI IDE workflows

Your Output Must Include:

1. Clear Problem Definition
   - What exact developer pain does this package solve?
   - Why existing tools (ESLint, Prettier, tests) do NOT solve it

2. Package Responsibility (VERY IMPORTANT)
   - What this package MUST do
   - What it MUST NOT do (to avoid scope creep)

3. Core Concepts & Artifacts
   - Intent definition format (files, schemas, DSL, JSON/YAML/TS)
   - Architectural memory representation
   - Meaning-level logic fingerprinting (conceptual, not exact code)

4. Technical Architecture
   - How the package reads intent
   - How it analyzes generated code
   - How validation rules are applied
   - How results are returned (errors, warnings, suggestions)

5. CLI Design
   - Commands (init, validate, explain, diff, etc.)
   - Example CLI usage
   - How AI IDEs would invoke it

6. Validation Engine Design
   - Static analysis techniques
   - AST usage
   - Constraint evaluation flow
   - Confidence scoring or certainty levels (if any)

7. Optional / Advanced Capabilities
   - Architectural drift detection
   - Semantic duplication detection
   - AI feedback loop (how violations can be explained back to AI)

8. MVP vs Future Roadmap
   - What is the smallest valuable version?
   - What comes later without breaking design?

9. Developer Experience
   - How a developer adopts this in an existing repo
   - Required setup files
   - Zero-config vs explicit config philosophy

10. Non-Goals
   - Explicitly state what problems this package does NOT attempt to solve

Constraints:
- Do NOT propose another framework
- Do NOT rely on runtime execution
- Do NOT depend on proprietary AI APIs
- Keep everything inspectable, deterministic, and open-source friendly

Tone:
- Precise
- Engineering-focused
- No buzzwords
- Think like you are designing the next ESLint-level infrastructure tool for AI-assisted development

Deliver the plan as a structured technical document.
