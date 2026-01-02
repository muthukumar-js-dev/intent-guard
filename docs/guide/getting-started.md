# Getting Started

This guide will help you set up architectural validation for your project in minutes.

> [!TIP]
> **New to Intent Guard?** Skip manual configuration! Jump to the [AI-Powered Configuration Generator](#🤖-ai-powered-configuration-generator) to auto-generate your `intent.config.yaml` in minutes. Just copy the prompt and paste it into your AI assistant. 🚀

## Prerequisites

- **Node.js**: Version 16.0.0 or higher
- **Package Manager**: npm, yarn, or pnpm
- **A Project**: Any JavaScript or TypeScript project (frontend, backend, or fullstack)

## Installation

Install Intent Guard as a development dependency in your project root.

::: code-group
```bash [npm]
npm install --save-dev intent-guard-core
```
```bash [yarn]
yarn add --dev intent-guard-core
```
```bash [pnpm]
pnpm add -D intent-guard-core
```
:::

## Quick Start: Validate AI Code in 5 Minutes

### 1. Initialize Intent Guard

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

> [!NOTE]
> **Want to skip manual configuration?** Use the [AI-Powered Configuration Generator](#🤖-ai-powered-configuration-generator) below to automatically analyze your project and generate a production-ready config.

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
🔍 Intent Guard Validation Report

✅ No violations found!
   Analyzed 42 files
```

**❌ Failure:**
```
🔍 Intent Guard Validation Report

src/domain/user.ts
  ❌ Layer "domain" cannot import from layer "infrastructure" [layer-boundary]
     at src/domain/user.ts:3
     💡 Allowed imports: (none)

Summary:
  ❌ 1 error(s)
  📁 42 file(s) analyzed
```

### 5. Add to package.json Scripts (Recommended)

For easier usage, add Intent Guard to your `package.json` scripts:

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

Now Intent Guard runs automatically before every commit!

## 🤖 AI-Powered Configuration Generator

Creating the perfect `intent.config.yaml` can be time-consuming, especially if you're new to Intent Guard or working with a large codebase. Use this AI prompt to automatically generate your configuration based on your project structure.

### How to Use This Prompt

1. **Run the init command** to create the `.intentguard` directory:
   ```bash
   npx intent-guard init
   ```

2. **Copy the prompt below** (click the copy icon in the top-right corner of the code block)

3. **Paste it into your AI assistant** (Cursor, GitHub Copilot, Claude, ChatGPT, etc.)

4. **Let AI analyze your project** and generate a tailored configuration

5. **Review and adjust** the generated config as needed

### 📋 AI Configuration Generator Prompt

Click the copy button to copy this entire prompt:

```txt
You are an expert software architect helping me set up Intent Guard for my project.

CONTEXT:
Intent Guard is an architectural validation tool that enforces boundaries in AI-assisted coding. It prevents AI from breaking architectural rules by validating code against a YAML configuration file.

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

**Remember**: Intent Guard enforces the architecture YOU define. The AI prompt helps you define it faster, but you're still in control.

## Next Steps

- [Learn about Core Concepts](/guide/core-concepts)
- [Explore Configuration Options](/configuration)
- [Set up AI Integration](/guide/ai-integration)
- [See Real-World Examples](/guide/examples)
