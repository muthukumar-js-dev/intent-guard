# AI Integration Guide

Intent-Guard is built to be a "guardrail" for AI agents. Here's how to integrate it into your workflow.

## Using with Cursor

Add to your `.cursorrules` or project instructions:

```
Before making changes to the codebase:
1. Run: npx intent-guard rules-for <file-path>
2. Review the architectural rules for that file
3. Ensure your changes comply with the rules

After making changes:
1. Run: npx intent-guard validate --diff
2. Fix any violations before committing
```

## Using with Windsurf

Add to your cascade instructions:

```
Architectural Rules:
- Always run `npx intent-guard rules-for <file>` before editing
- After editing, run `npx intent-guard validate --diff`
- Fix all violations before proceeding
```

## Context Injection (Rule Retrieval)

When asking an AI to modify a file, first provide it with the rules for that file.

**Prompt Pattern:**

> I want you to modify `src/user.ts`.
> Here are the architectural rules for this file:
> [EXECUTE: `npx intent-guard rules-for src/user.ts`]

## Self-Correction Loop

If an AI agent generates code that violates architecture, use `validate` to provide feedback.

**Agent Workflow:**

1. Agent writes code
2. Agent runs `npx intent-guard validate --diff --format json`
3. If exit code is `1`, Agent reads the JSON output
4. Agent fixes the specific architectural violations reported

## Pre-Commit Hook (Husky)

Ensure no violations enter your repository.

**File**: `.husky/pre-commit`

```bash
#!/bin/sh
npx intent-guard validate --diff || exit 1
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Validate Architecture
  run: npx intent-guard validate --diff
```

### GitLab CI

```yaml
validate:
  script:
    - npx intent-guard validate --diff
```

### CircleCI

```yaml
- run:
    name: Validate Architecture
    command: npx intent-guard validate --diff
```
