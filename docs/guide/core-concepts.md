# Core Concepts

Understanding how Intent Guard models your architecture is key to writing effective rules.

## 1. Layers & Boundaries

The primary way Intent Guard enforces architecture is through **Layers**. A layer is simply a group of files defined by a glob pattern.

### The "One-Way Flow" Rule

Architecture is often about **direction of dependency**.
- Ideally: `UI -> Domain -> Infrastructure`
- Bad: `Domain -> UI` (Circular dependency / Spaghetti code)

In `intent.config.yaml`, you define this by stating what each layer **`canImportFrom`**.

```yaml
- name: high-level
  path: src/high-level/**
  canImportFrom: [low-level]
```

If `high-level` tries to import from a layer *not* in that list, Intent Guard blocks it.

### Strict Mode
Intent Guard operates on a "whitelist" basis. If you don't list a layer in `canImportFrom`, importing from it is forbidden. This ensures strict isolation by default.

## 2. Protected Regions

Some parts of your codebase are too critical to be modified by AI without human oversight. These are **Protected Regions**.

Common candidates for protection:
- 🔐 **Authentication Logic**: `src/auth/**`
- 💳 **Payment Processing**: `src/payments/**`
- ⚙️ **Core Configuration**: `src/config/**`
- 🛑 **Secrets & Keys**: `src/constants/secrets.ts`

### Immutable by AI
When you mark a region as `aiMutable: false`, Intent Guard's validation (specifically the `--diff` mode) checks if those files have been modified.

```yaml
protectedRegions:
  - path: src/auth/**
    reason: "Security critical - Manual review required"
    aiMutable: false
```

Usage with AI:
> If an AI agent attempts to refactor your Code, it runs `validate --diff`. Intent Guard sees a change in `src/auth/login.ts` and fails with: "❌ Violation: Protected file modified." The AI must then revert the change or ask for human intervention.

## 3. Dependency Guardrails

Beyond internal structure, you often want to control **external** dependencies.

### Banned Dependencies
You can explicitly ban packages to:
- **Prevent bloat**: Ban `lodash` in favor of native methods or `lodash-es`.
- **Enforce standards**: Ban `moment` (deprecated) in favor of `date-fns`.
- **Security**: Ban known vulnerable or abandoned packages.

```yaml
bannedDependencies:
  - package: moment
    reason: "Deprecated. Use date-fns."
    alternatives: [date-fns]
```

If `import moment from 'moment'` appears anywhere, validation fails.
