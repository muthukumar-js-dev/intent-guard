<div align="center">

<img src="./public/assets/logo.png" alt="Intent-Guard" width="120" height="120" />

# Intent-Guard 🛡️

**Deterministic Architectural Controller for AI-Assisted Coding**

[![npm version](https://badge.fury.io/js/intent-guard.svg)](https://www.npmjs.com/package/intent-guard)
[![License: PROPRIETARY](https://img.shields.io/badge/License-PROPRIETARY-red.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)

*Enforce architectural rules and prevent AI from breaking your codebase structure*

</div>

---

## What is Intent-Guard?

**Intent-Guard** is a validation tool that enforces architectural rules in codebases where AI writes code.

Think of it as a **guardrail system** for AI coding assistants (Cursor, GitHub Copilot, Windsurf, etc.). You define your project's architectural boundaries, and Intent-Guard validates that AI-generated code respects them.

**In one sentence**: Intent-Guard prevents AI from breaking your architecture by validating code against rules you define.

---

## 🎯 Framework & Tool Compatibility

### Works with ANY JavaScript/TypeScript Project! ✅

Intent-Guard is **100% framework-agnostic**. It analyzes your source code structure (imports, exports, dependencies) - not framework-specific features.

#### ✅ Frontend Frameworks
React • Next.js • Vue.js • Nuxt.js • Angular • Svelte • SvelteKit • Solid.js • Remix • Astro • Qwik • Preact • Vanilla JS/TS

#### ✅ Backend Frameworks  
Express.js • Fastify • Nest.js • Koa • Hapi • Adonis.js • Serverless Functions • AWS Lambda • Node.js

#### ✅ Build Tools
Webpack • Vite • Rollup • esbuild • Turbopack • Parcel • SWC • Babel

#### ✅ Monorepo Tools
Turborepo • Nx • Lerna • pnpm Workspaces • Yarn Workspaces • npm Workspaces

### How Does It Work?

Intent-Guard validates **source code structure**, not runtime behavior:

```
✅ Checks: import/export statements, module dependencies, file organization
❌ Doesn't check: Component props, API responses, business logic
```

**Example**: Whether you use React hooks, Vue composables, or Express middleware - Intent-Guard ensures they import from the correct architectural layers.

### Monorepo Support

Define architectural rules:
- **Per package** (each package has its own `.intentguard/` folder)
- **Globally** (one `.intentguard/` at monorepo root)
- **Mixed** (global rules + package-specific overrides)

---

## The Problem

AI coding assistants are powerful, but they don't understand your project's architecture:

### Real Problems Developers Face:

❌ **AI violates layer boundaries**  
Your AI assistant imports `database.ts` directly into your UI component, bypassing your service layer.

❌ **AI duplicates logic across modules**  
The AI recreates authentication logic in 3 different places instead of using your existing `AuthService`.

❌ **AI modifies protected code**  
The AI "helpfully" refactors your critical payment processing logic without understanding the implications.

❌ **AI adds banned dependencies**  
The AI suggests `moment.js` when your team has standardized on `date-fns`.

### Why Existing Tools Aren't Enough:

- **ESLint**: Catches syntax and style issues, not architectural violations
- **TypeScript**: Enforces types, not module boundaries
- **Tests**: Validate behavior, not structure
- **Code Review**: Happens too late, after AI has already written the code

**Intent-Guard validates BEFORE the code reaches your codebase.**

---

## What Intent-Guard DOES and DOES NOT Do

### ✅ DOES:

- **Enforces layer boundaries** (e.g., "Domain layer cannot import Infrastructure")
- **Protects critical code** from AI modification (file-level or block-level)
- **Blocks banned dependencies** from entering your codebase
- **Detects architectural drift** (new violations appearing over time)
- **Validates only changed files** (`--diff` mode for speed)
- **Provides AI-readable feedback** via `rules-for` command

### ❌ DOES NOT:

- Generate or write code
- Replace ESLint, Prettier, or TypeScript
- Run tests or validate business logic
- Require a specific framework (works with any Node.js project)
- Need a build step or compilation

---

## How Intent-Guard Works

```
┌─────────────────┐
│  You Define     │
│  Architecture   │──┐
│  Rules (YAML)   │  │
└─────────────────┘  │
                     │
┌─────────────────┐  │    ┌──────────────────┐
│  AI Generates   │  │    │  Intent-Guard    │
│  Code           │──┼───▶│  Validates       │
└─────────────────┘  │    └──────────────────┘
                     │              │
┌─────────────────┐  │              ▼
│  AI Reads       │  │    ┌──────────────────┐
│  Rules (JITC)   │◀─┘    │  ✅ Pass / ❌ Fail│
└─────────────────┘       └──────────────────┘
```

**Flow**:
1. You define architectural rules in `.intentguard/intent.config.yaml`
2. AI generates code
3. Intent-Guard validates the code against your rules
4. If violations exist, AI sees the error and self-corrects

---

## Installation

```bash
# npm
npm install --save-dev intent-guard

# yarn
yarn add --dev intent-guard

# pnpm
pnpm add -D intent-guard
```

**Requirements**: Node.js >= 16.0.0

---

## Quick Start (5 Minutes)

### 1. Initialize Intent-Guard

```bash
npx intent-guard init
```

This creates:
```
.intentguard/
  ├── intent.config.yaml  # Your architectural rules
  └── .gitignore          # Excludes memory.json from git
```

### 2. Define Your Architecture

> **💡 New to Intent-Guard or have a large codebase?**  
> Skip the manual setup! Use our [**AI-Powered Configuration Generator**](#ai-config-generator) to automatically create your `intent.config.yaml` by analyzing your project structure. Just copy the prompt, paste it into your AI assistant, and get a production-ready config in minutes! 🚀

Edit `.intentguard/intent.config.yaml`:

```yaml
version: "1.0.0"

architecture:
  layers:
    - name: domain
      path: src/domain/**
      canImportFrom: []  # Domain is isolated
    
    - name: application
      path: src/application/**
      canImportFrom: [domain]
    
    - name: infrastructure
      path: src/infrastructure/**
      canImportFrom: [domain, application]
```

### 3. Validate Your Codebase

```bash
# Validate entire codebase
npx intent-guard validate

# Validate only changed files (faster)
npx intent-guard validate --diff
```

### 4. Example Output

**✅ Success:**
```
🔍 Intent-Guard Validation Report

✅ No violations found!
   Analyzed 42 files
```

**❌ Failure:**
```
🔍 Intent-Guard Validation Report

src/domain/user.ts
  ❌ Layer "domain" cannot import from layer "infrastructure" [layer-boundary]
     at src/domain/user.ts:3
     💡 Allowed imports: (none)

Summary:
  ❌ 1 error(s)
  📁 42 file(s) analyzed
```

### 5. Add to package.json Scripts (Recommended)

For easier usage, add Intent-Guard to your `package.json` scripts:

```json
{
  "scripts": {
    "validate": "intent-guard validate",
    "validate:diff": "intent-guard validate --diff",
    "validate:ci": "intent-guard validate --format json",
    "precommit": "intent-guard validate --diff"
  }
}
```

Now you can run:
```bash
npm run validate        # Validate entire codebase
npm run validate:diff   # Validate only changed files
npm run validate:ci     # JSON output for CI/CD
```

### 6. Integrate with Git Hooks (Optional)

Prevent violations from being committed:

```bash
# Install husky
npm install --save-dev husky

# Initialize husky
npx husky init

# Add pre-commit hook
echo "npm run validate:diff" > .husky/pre-commit
```

Now Intent-Guard runs automatically before every commit!

---

<a id="ai-config-generator"></a>

## 🤖 AI-Powered Configuration Generator

Creating the perfect `intent.config.yaml` can be time-consuming, especially if you're new to Intent-Guard or working with a large codebase. Use this AI prompt to automatically generate your configuration based on your project structure.

### How to Use This Prompt

1. **Run the init command** to create the `.intentguard` directory:
   ```bash
   npx intent-guard init
   ```

2. **Copy the prompt below** and paste it into your AI assistant (Cursor, GitHub Copilot, Claude, ChatGPT, etc.)

3. **Let AI analyze your project** and generate a tailored configuration

4. **Review and adjust** the generated config as needed

### 📋 Copy This Prompt

```
You are an expert software architect helping me set up Intent-Guard for my project.

CONTEXT:
Intent-Guard is an architectural validation tool that enforces boundaries in AI-assisted coding. It prevents AI from breaking architectural rules by validating code against a YAML configuration file.

YOUR TASK:
1. Analyze my project structure and codebase
2. Identify the architectural patterns and layers
3. Generate a comprehensive `.intentguard/intent.config.yaml` file

ANALYSIS STEPS:

Step 1: PROJECT DISCOVERY
- Scan the project directory structure
- Identify the framework/stack (React, Next.js, Express, Vue, Angular, etc.)
- Locate source code directories (src/, app/, packages/, etc.)
- Identify key architectural folders (components, services, utils, domain, infrastructure, etc.)
- Check package.json for dependencies and project type

Step 2: ARCHITECTURAL PATTERN RECOGNITION
Identify which architectural pattern(s) are used:
- Layered Architecture (UI → Services → Data)
- Clean Architecture (Domain-centric with dependency inversion)
- Feature-based (Modules organized by feature)
- Monorepo (Multiple packages with cross-dependencies)
- MVC/MVVM pattern
- Hexagonal Architecture
- Microservices structure

Step 3: LAYER IDENTIFICATION
For each identified layer/module:
- Name: Clear, descriptive layer name
- Path: Glob pattern matching files in this layer
- Dependencies: What other layers can this import from?
- Rationale: Why this boundary exists

Step 4: CRITICAL CODE PROTECTION
Identify files/directories that should be protected from AI modification:
- Authentication/authorization logic
- Payment processing
- Security configurations (API keys, secrets)
- Database migrations
- Core business logic
- Third-party integrations
- Configuration files

Step 5: DEPENDENCY ANALYSIS
Check for:
- Deprecated packages that should be banned (moment, request, etc.)
- Large packages with better alternatives (lodash → lodash-es)
- Packages that violate team standards
- Type packages in wrong dependency section

CONFIGURATION REQUIREMENTS:

1. LAYERS SECTION:
   - Define clear, logical layers based on actual project structure
   - Ensure dependency flow makes sense (no circular dependencies)
   - Use descriptive names (not "layer1", "layer2")
   - Include glob patterns that match actual file paths
   - Add comments explaining each layer's purpose

2. PROTECTED REGIONS:
   - Identify security-critical code
   - Identify business-critical code
   - Identify compliance-critical code
   - Provide clear reasons for protection
   - Set aiMutable: false for critical areas

3. BANNED DEPENDENCIES:
   - List deprecated packages
   - Suggest modern alternatives
   - Explain why each is banned
   - Consider bundle size, maintenance, security

4. DOCUMENTATION:
   - Add YAML comments explaining the architecture
   - Document the dependency flow
   - Explain any non-obvious rules
   - Include examples where helpful

OUTPUT FORMAT:
Generate a complete `.intentguard/intent.config.yaml` file with:
- Proper YAML syntax
- Comprehensive comments
- All sections filled based on analysis
- Ready to use without modification (but reviewable)

EXAMPLE STRUCTURE (adapt to my project):

version: "1.0.0"

# [Brief description of the architectural pattern used]
# Dependency Flow: [Layer A] → [Layer B] → [Layer C]

architecture:
  layers:
    # [Layer description]
    - name: layer-name
      path: src/path/**
      canImportFrom: [other-layers]
      # Comment: Why this layer exists and its boundaries

protectedRegions:
  # [Protection category: Security/Business/Compliance]
  - path: src/critical/**
    reason: "Clear explanation of why this is protected"
    aiMutable: false

bannedDependencies:
  # [Category: Deprecated/Performance/Security]
  - package: package-name
    reason: "Why this is banned"
    alternatives: [better-option-1, better-option-2]

IMPORTANT GUIDELINES:
✅ DO:
- Analyze actual project structure, don't assume
- Create realistic, enforceable boundaries
- Use glob patterns that match real paths
- Provide clear, actionable reasons
- Consider the project's specific needs
- Add helpful comments throughout
- Make it production-ready

❌ DON'T:
- Create overly restrictive rules that block legitimate code
- Use generic layer names without context
- Add rules that don't match the actual architecture
- Forget to explain WHY rules exist
- Create circular dependencies
- Over-complicate for simple projects

ADDITIONAL CONTEXT:
- Framework: [Auto-detect or ask me]
- Project Type: [Frontend/Backend/Fullstack/Monorepo]
- Team Size: [Infer from project complexity]
- Architectural Style: [Detect from structure]

START ANALYSIS NOW:
Please analyze my project and generate the complete intent.config.yaml file.
```

### 💡 Tips for Best Results

**Before running the prompt:**
- Ensure your project has a clear directory structure
- Have a `package.json` file in your project root
- Organize code into logical folders (even if basic)

**After AI generates the config:**
1. **Review the layers** - Do they match your mental model?
2. **Test the rules** - Run `npx intent-guard validate` to see if there are existing violations
3. **Iterate** - Adjust rules based on validation results
4. **Document** - Add team-specific comments to the YAML file

**For complex projects:**
- Run the prompt multiple times for different parts (frontend, backend, shared)
- Merge the results manually
- Start with loose rules, tighten over time

### 🎯 What This Prompt Does

This advanced prompt instructs AI to:

1. **🔍 Deep Project Analysis**
   - Scans your entire codebase structure
   - Identifies frameworks, patterns, and conventions
   - Understands your architectural style

2. **🧠 Intelligent Layer Detection**
   - Recognizes common patterns (Clean Architecture, MVC, etc.)
   - Identifies logical boundaries in your code
   - Maps dependency relationships

3. **🛡️ Security-First Approach**
   - Flags sensitive code for protection
   - Identifies critical business logic
   - Suggests appropriate restrictions

4. **📦 Dependency Optimization**
   - Detects deprecated packages
   - Suggests modern alternatives
   - Considers bundle size and performance

5. **📝 Production-Ready Output**
   - Generates complete, valid YAML
   - Includes helpful comments
   - Ready to use immediately

### 🔄 Iterative Refinement

The generated config is a **starting point**, not the final version:

```bash
# 1. Generate config with AI prompt
# 2. Test it
npx intent-guard validate

# 3. See what violations exist
# 4. Decide: Fix code or adjust rules?

# 5. Iterate until you have the right balance
```

**Remember**: Intent-Guard enforces the architecture YOU define. The AI prompt helps you define it faster, but you're still in control.

---

## Integration with Development Workflow

### CI/CD Integration

**GitHub Actions Example**:

```yaml
# .github/workflows/validate.yml
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

**GitLab CI Example**:

```yaml
# .gitlab-ci.yml
validate:
  stage: test
  script:
    - npm ci
    - npm run validate
```

### Pre-commit Hook (Detailed)

Using **lint-staged** for faster validation:

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

---

## Configuration File Explained

The `.intentguard/intent.config.yaml` file is your **architectural contract**.

### Basic Structure:

```yaml
version: "1.0.0"

# Define your architectural layers
architecture:
  layers:
    - name: presentation      # Layer name
      path: src/ui/**         # Files in this layer
      canImportFrom: [domain] # What this layer can import
      cannotImportFrom: []    # Explicit bans (optional)

# Protect critical files from AI modification
protectedRegions:
  - path: src/config/secrets.ts
    reason: "Contains API keys"
    aiMutable: false  # AI cannot modify this file

# Ban specific npm packages
bannedDependencies:
  - package: moment
    reason: "Use date-fns instead"
    alternatives: [date-fns]
```

### How AI Uses This File:

When you use the `rules-for` command, AI assistants can query Intent-Guard to understand what imports are allowed for a specific file:

```bash
npx intent-guard rules-for src/domain/user.ts
```

Output (JSON):
```json
{
  "file": "src/domain/user.ts",
  "layer": "domain",
  "canImportFrom": [],
  "isProtected": false,
  "bannedDependencies": [...]
}
```

AI reads this and self-corrects before generating code.

---

## CLI Commands

### `init`

**Purpose**: Initialize Intent-Guard in your project

```bash
npx intent-guard init
```

**What it does**:
- Creates `.intentguard/` directory
- Generates default `intent.config.yaml`
- Creates `.gitignore` to exclude `memory.json`

---

### `validate`

**Purpose**: Validate your codebase against architectural rules

```bash
# Validate entire codebase
npx intent-guard validate

# Validate only changed files (git diff)
npx intent-guard validate --diff

# Output as JSON
npx intent-guard validate --format json

# Reset architectural baseline
npx intent-guard validate --baseline
```

**Options**:
- `--diff`: Only validate files changed since last commit (50-100x faster)
- `--format <json|text>`: Output format (default: text)
- `--baseline`: Reset the architectural memory baseline

**When to use**:
- In CI/CD pipelines
- As a pre-commit hook
- Before merging AI-generated code

---

### `rules-for <file>`

**Purpose**: Get architectural rules for a specific file (AI context)

```bash
npx intent-guard rules-for src/domain/user.ts
```

**Output** (JSON):
```json
{
  "file": "src/domain/user.ts",
  "layer": "domain",
  "canImportFrom": [],
  "isProtected": false,
  "bannedDependencies": []
}
```

**When to use**:
- In AI IDE prompts (Just-In-Time Context)
- To understand what a file can import
- For debugging layer violations

---

## Using Intent-Guard with AI IDEs

### Recommended Workflow:

1. **Add to your AI instructions**:

```
Before generating code, run:
npx intent-guard rules-for <file-path>

Then respect the architectural rules shown.

After generating code, run:
npx intent-guard validate --diff

If validation fails, fix the violations and try again.
```

2. **Example AI Prompt**:

```
I need to add a new feature to src/application/auth-service.ts.

First, check the architectural rules:
npx intent-guard rules-for src/application/auth-service.ts

Then write the code following those rules.

After writing, validate:
npx intent-guard validate --diff
```

3. **Validation Feedback Loop**:

```
AI generates code → Intent-Guard validates → AI sees errors → AI fixes → Repeat until ✅
```

This creates a **self-correcting AI** that respects your architecture.

---

## Troubleshooting & Tips

### Common Issues

#### ❌ "Configuration file not found"

**Problem**: Intent-Guard can't find `.intentguard/intent.config.yaml`

**Solution**:
```bash
# Make sure you're in the project root
cd /path/to/your/project

# Initialize if not done
npx intent-guard init

# Verify file exists
ls .intentguard/intent.config.yaml
```

---

#### ❌ "--diff mode requires a git repository"

**Problem**: You're using `--diff` in a non-git project

**Solution**:
```bash
# Option 1: Initialize git
git init

# Option 2: Use full validation (slower)
npx intent-guard validate
```

---

#### ❌ "Layer 'X' cannot import from layer 'Y'"

**Problem**: Your code violates layer boundaries

**Solution**:
1. Check your `intent.config.yaml` to see allowed imports
2. Either fix the import or update your architecture rules
3. Use `rules-for` to see what's allowed:
   ```bash
   npx intent-guard rules-for src/your-file.ts
   ```

---

#### ❌ "Protected region modification detected"

**Problem**: AI modified code inside `// #protected-start` ... `// #protected-end`

**Solution**:
```bash
# Revert the protected block changes
git checkout HEAD -- path/to/file.ts

# Or remove protection if intentional:
# Edit intent.config.yaml and set aiMutable: true
```

---

### Performance Tips

**For large codebases (1000+ files)**:

1. **Always use `--diff` mode** during development:
   ```bash
   npm run validate:diff  # 50-100x faster
   ```

2. **Use full validation only in CI**:
   ```jsonc
   {
     "scripts": {
       "validate": "intent-guard validate",      // CI only
       "validate:dev": "intent-guard validate --diff"  // Development
     }
   }
   ```

3. **Exclude generated files** in `.intentguard/intent.config.yaml`:
   ```yaml
   # Add to your config (future feature)
   exclude:
     - "**/*.generated.ts"
     - "**/dist/**"
     - "**/node_modules/**"
   ```

---

### Configuration Tips

#### Organizing Large Architectures

For complex projects, use descriptive layer names:

```yaml
architecture:
  layers:
    # Frontend layers
    - name: ui-components
      path: src/components/**
      canImportFrom: [ui-hooks, shared-types]
    
    - name: ui-hooks
      path: src/hooks/**
      canImportFrom: [api-client, shared-types]
    
    # Backend layers
    - name: api-routes
      path: src/routes/**
      canImportFrom: [business-logic, database]
    
    - name: business-logic
      path: src/services/**
      canImportFrom: [database, shared-types]
    
    - name: database
      path: src/db/**
      canImportFrom: [shared-types]
    
    # Shared
    - name: shared-types
      path: src/types/**
      canImportFrom: []
```

#### Multiple Protected Regions

```yaml
protectedRegions:
  - path: src/config/**
    reason: "Environment configuration - requires security review"
    aiMutable: false
  
  - path: src/payments/**
    reason: "Payment processing - critical business logic"
    aiMutable: false
  
  - path: src/auth/**
    reason: "Authentication - security sensitive"
    aiMutable: false
```

#### Banned Dependencies with Alternatives

```yaml
bannedDependencies:
  - package: moment
    reason: "Deprecated and large bundle size"
    alternatives: [date-fns, dayjs]
  
  - package: request
    reason: "Deprecated - no longer maintained"
    alternatives: [axios, node-fetch, got]
  
  - package: lodash
    reason: "Use lodash-es for tree-shaking"
    alternatives: [lodash-es]
  
  - pattern: "^@types/.*"
    reason: "Types should be in devDependencies"
    alternatives: []
```

---

## Advanced Features

### 🔒 Protected Regions (Block-Level)

Protect specific code blocks from AI modification:

```typescript
// src/config/api-keys.ts

export const PUBLIC_KEY = "pk_live_...";

// #protected-start
export const SECRET_KEY = "sk_live_...";
export const WEBHOOK_SECRET = "whsec_...";
// #protected-end
```

AI can modify the file, but **cannot change the protected block**.

---

### 📊 Architectural Drift Guard

Intent-Guard automatically tracks your architectural health:

```bash
# First run: Creates baseline
npx intent-guard validate
# ℹ Initialized new architectural memory
# ✅ No violations found!

# Later: New violations appear
npx intent-guard validate
# 🚨 ARCHITECTURAL DRIFT DETECTED
# Errors increased from 0 to 3
# Fix the new errors or run with --baseline to accept the new state
```

**Ratchet System**: If you fix violations, the baseline automatically improves.

---

## Common Use Cases

### 1. Preventing Layer Violations

**Problem**: AI imports database code directly into React components

**Solution**:
```yaml
architecture:
  layers:
    - name: ui
      path: src/components/**
      canImportFrom: [hooks, utils]  # No database access
```

---

### 2. Enforcing Clean Architecture

**Problem**: Domain logic depends on infrastructure

**Solution**:
```yaml
architecture:
  layers:
    - name: domain
      path: src/domain/**
      canImportFrom: []  # Pure business logic
    
    - name: infrastructure
      path: src/infrastructure/**
      canImportFrom: [domain]  # Depends on domain, not vice versa
```

---

### 3. Protecting Critical Code

**Problem**: AI refactors payment processing logic

**Solution**:
```yaml
protectedRegions:
  - path: src/payments/**
    reason: "Payment logic requires security review"
    aiMutable: false
```

---

### 4. Blocking Deprecated Packages

**Problem**: AI suggests old dependencies

**Solution**:
```yaml
bannedDependencies:
  - package: request
    reason: "Deprecated - use axios or fetch"
    alternatives: [axios, node-fetch]
```

---

## Best Practices

### 1. Start Small, Iterate

Don't try to define your entire architecture on day one:

```yaml
# Week 1: Start with basic layers
architecture:
  layers:
    - name: frontend
      path: src/frontend/**
      canImportFrom: [shared]
    
    - name: backend
      path: src/backend/**
      canImportFrom: [shared]
    
    - name: shared
      path: src/shared/**
      canImportFrom: []
```

Then refine over time as you understand your architecture better.

### 2. Use Descriptive Layer Names

❌ **Bad**:
```yaml
- name: layer1
  path: src/a/**
```

✅ **Good**:
```yaml
- name: presentation-layer
  path: src/ui/**
```

### 3. Document Your Architecture

Add comments to your `intent.config.yaml`:

```yaml
# Clean Architecture Pattern
# Flow: UI → Application → Domain ← Infrastructure
architecture:
  layers:
    - name: ui
      path: src/ui/**
      canImportFrom: [application, domain]
      # UI can use application services and domain models
    
    - name: application
      path: src/application/**
      canImportFrom: [domain]
      # Application orchestrates domain logic
    
    - name: domain
      path: src/domain/**
      canImportFrom: []
      # Domain is isolated - pure business logic
    
    - name: infrastructure
      path: src/infrastructure/**
      canImportFrom: [domain, application]
      # Infrastructure implements interfaces defined in domain
```

### 4. Protect Critical Code Early

Identify and protect your most critical files immediately:

```yaml
protectedRegions:
  # Security-critical
  - path: src/auth/**
    reason: "Authentication logic - security review required"
    aiMutable: false
  
  # Business-critical
  - path: src/billing/**
    reason: "Payment processing - financial impact"
    aiMutable: false
  
  # Compliance-critical
  - path: src/gdpr/**
    reason: "GDPR compliance logic - legal review required"
    aiMutable: false
```

### 5. Use `--diff` Mode in Development

**Always** use `--diff` during active development:

```json
{
  "scripts": {
    "dev:validate": "intent-guard validate --diff",
    "ci:validate": "intent-guard validate"
  }
}
```

Run `dev:validate` while coding, `ci:validate` in CI/CD.

### 6. Combine with Other Tools

Intent-Guard complements (doesn't replace) other tools:

```json
{
  "scripts": {
    "lint": "eslint src",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "validate": "intent-guard validate --diff",
    "check-all": "npm run lint && npm run type-check && npm run validate && npm run test"
  }
}
```

### 7. Review Architectural Memory Regularly

Check your architectural health:

```bash
# View current baseline
cat .intentguard/memory.json

# If you've fixed violations, verify improvement
npm run validate
# ✨ Architectural baseline improved!
# Errors reduced from 5 to 2
```

---

## Real-World Examples

### Example 1: Next.js Application

```yaml
# .intentguard/intent.config.yaml
version: "1.0.0"

architecture:
  layers:
    - name: pages
      path: src/pages/**
      canImportFrom: [components, hooks, lib, types]
    
    - name: components
      path: src/components/**
      canImportFrom: [hooks, lib, types]
    
    - name: hooks
      path: src/hooks/**
      canImportFrom: [lib, types]
    
    - name: lib
      path: src/lib/**
      canImportFrom: [types]
    
    - name: types
      path: src/types/**
      canImportFrom: []

protectedRegions:
  - path: src/lib/auth/**
    reason: "Authentication logic"
    aiMutable: false

bannedDependencies:
  - package: moment
    reason: "Use date-fns for smaller bundle"
    alternatives: [date-fns]
```

### Example 2: Express.js API

```yaml
version: "1.0.0"

architecture:
  layers:
    - name: routes
      path: src/routes/**
      canImportFrom: [controllers, middleware, types]
    
    - name: controllers
      path: src/controllers/**
      canImportFrom: [services, types]
    
    - name: services
      path: src/services/**
      canImportFrom: [repositories, types]
    
    - name: repositories
      path: src/repositories/**
      canImportFrom: [database, types]
    
    - name: database
      path: src/database/**
      canImportFrom: [types]
    
    - name: middleware
      path: src/middleware/**
      canImportFrom: [types]
    
    - name: types
      path: src/types/**
      canImportFrom: []

protectedRegions:
  - path: src/database/migrations/**
    reason: "Database migrations - require review"
    aiMutable: false
```

### Example 3: React + TypeScript Monorepo

```yaml
version: "1.0.0"

architecture:
  layers:
    # App layer
    - name: app
      path: packages/app/src/**
      canImportFrom: [ui-kit, shared-utils, shared-types]
    
    # UI Kit (design system)
    - name: ui-kit
      path: packages/ui-kit/src/**
      canImportFrom: [shared-types]
    
    # Shared utilities
    - name: shared-utils
      path: packages/shared/utils/**
      canImportFrom: [shared-types]
    
    # Shared types
    - name: shared-types
      path: packages/shared/types/**
      canImportFrom: []

bannedDependencies:
  - pattern: "^lodash$"
    reason: "Use lodash-es for tree-shaking"
    alternatives: [lodash-es]
```

---

## Current Limitations (MVP)

**Be aware**:

- ❌ **No auto-fix**: Intent-Guard only validates, it doesn't fix violations
- ❌ **JavaScript/TypeScript only**: No support for other languages yet
- ❌ **File-based analysis**: Doesn't understand runtime behavior
- ❌ **No IDE integration**: CLI-only (for now)
- ❌ **Requires Git for `--diff` mode**: Non-git projects must validate all files

**What may change**:
- Configuration schema may evolve
- New validation rules may be added
- Performance optimizations are ongoing

---

## When You SHOULD NOT Use Intent-Guard

Intent-Guard is **not for everyone**. Skip it if:

- ❌ **Small scripts** (< 100 lines of code)
- ❌ **One-off projects** (throwaway code)
- ❌ **Solo projects** with no AI assistance
- ❌ **Projects without clear architecture** (Intent-Guard enforces what you define)
- ❌ **Prototypes** where speed > structure

**Use Intent-Guard when**:
- ✅ You have a team using AI coding assistants
- ✅ Your project has defined architectural layers
- ✅ You need to prevent AI from breaking boundaries
- ✅ You want architectural drift detection

---

## Roadmap

**Future ideas** (no promises, no timelines):

- Auto-fix suggestions for common violations
- IDE extensions (VS Code, Cursor, etc.)
- Custom validation rules (plugin system)
- Integration with other linters (ESLint, etc.)
- Performance improvements for large codebases
- Enhanced monorepo features (workspace-aware validation, cross-package rules)

**Want to influence the roadmap?** [Share your ideas in Discussions](https://github.com/muthu-kumar369/intent-guard/discussions/categories/ideas-proposals)

---

## 🤝 Community, Feedback & Support

We welcome feedback, questions, and contributions!

### 🐞 Found a Bug?
[Report a bug](https://github.com/muthu-kumar369/intent-guard/issues/new?template=bug_report.yml) with reproduction steps and your configuration.

### 💡 Have a Feature Idea?
[Request a feature](https://github.com/muthu-kumar369/intent-guard/issues/new?template=feature_request.yml) describing the problem you're trying to solve.

### ❓ Questions or Feedback?
- **Quick questions**: [Ask here](https://github.com/muthu-kumar369/intent-guard/issues/new?template=question.yml)
- **Discussions**: [Join the conversation](https://github.com/muthu-kumar369/intent-guard/discussions)
- **Ideas**: [Share in Discussions](https://github.com/muthu-kumar369/intent-guard/discussions/categories/ideas-proposals)

### 💖 Support This Project
If Intent-Guard helps your team, consider [sponsoring the project](https://github.com/sponsors/muthu-kumar369) to support ongoing development and documentation.

---

## Contributing

Contributions are welcome! Here's how:

1. **Check existing issues** before creating new ones
2. **Use issue templates** for bugs and features
3. **Follow code style**: Run `npm run lint` and `npm run format`
4. **Write tests** for new features
5. **Keep PRs focused**: One feature/fix per PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## License

**Proprietary License** - See [LICENSE](LICENSE) file for details.

**Summary**: You may use this package in your applications, but you cannot redistribute, republish, or create derivative works. See the full license for complete terms.

---

## Acknowledgments

Built with:
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [@babel/parser](https://babeljs.io/docs/en/babel-parser) - AST parsing
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal styling

---

**Made with ❤️ for developers building with AI**

[⭐ Star on GitHub](https://github.com/muthu-kumar369/intent-guard) | [📦 View on npm](https://www.npmjs.com/package/intent-guard) | [💬 Discussions](https://github.com/muthu-kumar369/intent-guard/discussions)
