# CLI Reference

## `init`

Initialize Intent-Guard in a new project.

**Usage:**

```bash
npx intent-guard init
```

**Effect:**

- Creates `.intentguard/` directory.
- Generates default `intent.config.yaml`.
- Adds `.intentguard/` to `.gitignore`.

---

## `validate`

Scan the project for architectural violations.

**Usage:**

```bash
npx intent-guard validate [options]
```

**Options:**

- `--format <json|text>`: Output format (default: `text`)
- `--diff`: Validate only changed files (requires git)

**Examples:**

```bash
# Validate entire codebase
npx intent-guard validate

# Validate only changed files (faster)
npx intent-guard validate --diff

# JSON output for CI/CD
npx intent-guard validate --format json

# Combine options
npx intent-guard validate --diff --format json
```

**Exit Codes:**

- `0`: Success (No violations)
- `1`: Violations found or configuration error

**Notes:**

- `--diff` mode requires a git repository
- Changed files include modified, staged, and untracked files
- Use `--diff` in CI/CD to validate only PR changes

---

## `rules-for`

Get specific rules for a single file. Useful for injecting context into AI prompts.

**Usage:**

```bash
npx intent-guard rules-for <file-path>
```

**Example:**

```bash
npx intent-guard rules-for src/domain/user.ts
```

**Output (JSON):**

```json
{
  "file": "src/domain/user.ts",
  "layer": "domain",
  "allowedImports": [],
  "isProtected": false,
  "bannedDependencies": [...]
}
```
