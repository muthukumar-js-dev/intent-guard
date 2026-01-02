# What is Intent Guard?

**Intent Guard** is an architectural validation tool for AI-assisted coding. It validates AI-generated code against rules you define, preventing violations before they reach your codebase.

## The Problem

AI coding assistants (Cursor, GitHub Copilot, Windsurf) don't understand your project's architecture. They:
- Import database code into UI components
- Modify protected payment logic
- Violate layer boundaries
- Add banned dependencies

## The Solution

Intent Guard validates AI-generated code against architectural rules. If AI breaks your architecture, validation fails and the AI self-corrects.

## How It Works

```
┌─────────────────┐
│  You Define     │
│  Architecture   │──┐
│  Rules (YAML)   │  │
└─────────────────┘  │
                     │
┌─────────────────┐  │    ┌──────────────────┐
│  AI Generates   │  │    │  Intent Guard    │
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
3. Intent Guard validates the code against your rules
4. If violations exist, AI sees the error and self-corrects

## Framework & Tool Compatibility

### Works with ANY JavaScript/TypeScript Project! ✅

Intent Guard is **100% framework-agnostic**. It analyzes your source code structure (imports, exports, dependencies) - not framework-specific features.

#### ✅ Frontend Frameworks
React • Next.js • Vue.js • Nuxt.js • Angular • Svelte • SvelteKit • Solid.js • Remix • Astro • Qwik • Preact • Vanilla JS/TS

#### ✅ Backend Frameworks  
Express.js • Fastify • Nest.js • Koa • Hapi • Adonis.js • Serverless Functions • AWS Lambda • Node.js

#### ✅ Build Tools
Webpack • Vite • Rollup • esbuild • Turbopack • Parcel • SWC • Babel

#### ✅ Monorepo Tools
Turborepo • Nx • Lerna • pnpm Workspaces • Yarn Workspaces • npm Workspaces

### How Does It Work?

Intent Guard validates **source code structure**, not runtime behavior:

```
✅ Checks: import/export statements, module dependencies, file organization
❌ Doesn't check: Component props, API responses, business logic
```

**Example**: Whether you use React hooks, Vue composables, or Express middleware - Intent Guard ensures they import from the correct architectural layers.

### Monorepo Support

Define architectural rules:
- **Per package** (each package has its own `.intentguard/` folder)
- **Globally** (one `.intentguard/` at monorepo root)
- **Mixed** (global rules + package-specific overrides)

## What Intent Guard Does

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

## When to Use Intent Guard

Use Intent Guard if:
- ✅ You use AI coding assistants (Cursor, GitHub Copilot, Windsurf)
- ✅ Your project has defined architectural layers
- ✅ You need to prevent AI from violating boundaries

Don't use if:
- ❌ Small scripts (< 100 lines of code)
- ❌ One-off projects (throwaway code)
- ❌ Projects without clear architecture

## Comparison with Alternatives

| Tool | Purpose | What It Validates |
|------|---------|-------------------|
| **ESLint** | Code style | Syntax, formatting, best practices |
| **TypeScript** | Type safety | Types, interfaces, null safety |
| **Intent Guard** | Architecture | Layer boundaries, protected code |

**Best Practice**: Use Intent Guard **together** with ESLint and TypeScript. They solve different problems.
