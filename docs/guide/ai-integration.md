# AI Integration Guide

Intent Guard is built to be a "guardrail" for AI agents. Here's how to integrate it into your AI-assisted workflow.

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

## Using with GitHub Copilot

Add to your workspace instructions or use in prompts:

```
When modifying files:
1. Check architectural rules: npx intent-guard rules-for <file-path>
2. Generate code following those rules
3. Validate: npx intent-guard validate --diff
```

## Context Injection (Rule Retrieval)

When asking an AI to modify a file, first provide it with the rules for that file.

**Prompt Pattern:**

> I want you to modify `src/user.ts`.
> Here are the architectural rules for this file:
> [EXECUTE: `npx intent-guard rules-for src/user.ts`]

**Example Output:**
```json
{
  "file": "src/user.ts",
  "layer": "domain",
  "canImportFrom": [],
  "isProtected": false,
  "bannedDependencies": ["moment", "lodash"]
}
```

The AI now knows:
- This file is in the "domain" layer
- It cannot import from any other layers
- It should not use `moment` or `lodash`

## Self-Correction Loop

If an AI agent generates code that violates architecture, use `validate` to provide feedback.

**Agent Workflow:**

1. Agent writes code
2. Agent runs `npx intent-guard validate --diff --format json`
3. If exit code is `1`, Agent reads the JSON output
4. Agent fixes the specific architectural violations reported
5. Repeat until exit code is `0`

**Example Violation:**
```json
{
  "violations": [
    {
      "file": "src/domain/user.ts",
      "line": 3,
      "type": "layer-boundary",
      "message": "Layer 'domain' cannot import from layer 'infrastructure'",
      "suggestion": "Allowed imports: (none)"
    }
  ]
}
```

## Recommended AI Workflow

### Step 1: Query Rules
```bash
npx intent-guard rules-for src/application/auth-service.ts
```

### Step 2: Generate Code
AI generates code following the architectural rules.

### Step 3: Validate
```bash
npx intent-guard validate --diff
```

### Step 4: Fix if Needed
If validation fails, AI reads the error and self-corrects.

### Complete Example Prompt

```
I need to add a new feature to src/application/auth-service.ts.

First, check the architectural rules:
npx intent-guard rules-for src/application/auth-service.ts

Then write the code following those rules.

After writing, validate:
npx intent-guard validate --diff

If there are violations, fix them and validate again.
```

## Integration with Development Workflow

### Pre-commit Hook (Husky)

Ensure no violations enter your repository.

**File**: `.husky/pre-commit`

```bash
#!/bin/sh
npx intent-guard validate --diff || exit 1
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: Validate Architecture

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run validate
```

#### GitLab CI

```yaml
validate:
  stage: test
  script:
    - npm ci
    - npm run validate
```

#### CircleCI

```yaml
- run:
    name: Validate Architecture
    command: npx intent-guard validate --diff
```

### VS Code Integration

Add a task to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Validate Architecture",
      "type": "shell",
      "command": "npx intent-guard validate --diff",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

Run with: `Cmd/Ctrl + Shift + P` → "Run Task" → "Validate Architecture"

### lint-staged Integration

For faster validation with staged files:

```jsonc
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "intent-guard validate --diff"
    ]
  }
}
```

## Just-In-Time Context (JITC)

The `rules-for` command provides "Just-In-Time Context" - giving AI exactly the information it needs, when it needs it.

### Benefits

1. **Reduced Token Usage**: Only send relevant rules, not the entire config
2. **Accurate Context**: AI gets precise rules for the specific file
3. **Prevents Hallucination**: AI doesn't guess about architectural rules

### Usage Pattern

```bash
# Before editing any file
npx intent-guard rules-for <file-path>

# AI reads the output and follows the rules
```

## Validation Feedback Loop

```
AI generates code → Intent Guard validates → AI sees errors → AI fixes → Repeat until ✅
```

This creates a **self-correcting AI** that respects your architecture.

### Example Session

```bash
# AI generates code
# ...

# Validate
$ npx intent-guard validate --diff
❌ src/domain/user.ts
   Layer "domain" cannot import from layer "infrastructure"

# AI fixes the violation
# ...

# Validate again
$ npx intent-guard validate --diff
✅ No violations found!
```

## Best Practices

### 1. Always Use `--diff` in Development

```json
{
  "scripts": {
    "dev:validate": "intent-guard validate --diff",
    "ci:validate": "intent-guard validate"
  }
}
```

### 2. Query Rules Before Generating Code

Don't let AI guess. Always run `rules-for` first.

### 3. Use JSON Format for Programmatic Access

```bash
npx intent-guard validate --format json
```

Easier for AI to parse and understand.

### 4. Combine with Other Tools

```json
{
  "scripts": {
    "check-all": "npm run lint && npm run type-check && npm run validate && npm run test"
  }
}
```

### 5. Document Your Workflow

Add a `DEVELOPMENT.md` file explaining how your team uses Intent Guard with AI.
