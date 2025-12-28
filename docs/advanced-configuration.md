# Advanced Configuration

This guide covers advanced usage patterns for `intent.config.yaml` to help you manage complex repository structures and strict architectural constraints.

## Table of Contents
1. [Modular Architecture Patterns](#modular-architecture-patterns)
2. [Exclusion Patterns](#exclusion-patterns)
3. [Scoped Protected Regions](#scoped-protected-regions)
4. [CI/CD Integration](#cicd-integration)

---

## Modular Architecture Patterns

For monorepos or large applications, you might want to define architecture by feature modules rather than just technical layers.

### Feature-Sliced Design Example

```yaml
architecture:
  layers:
    - name: shared-kernel
      path: src/shared/**
      canImportFrom: []
      
    - name: features
      path: src/features/**
      canImportFrom: [shared-kernel]
      
    - name: pages
      path: src/pages/**
      canImportFrom: [features, shared-kernel]
      
    - name: app
      path: src/app/**
      canImportFrom: [pages, features, shared-kernel]
```

### Strict Encapsulation

To enforce strict boundaries where features cannot import other features:

```yaml
    - name: feature-auth
      path: src/features/auth/**
      canImportFrom: [shared-kernel]
      cannotImportFrom: [feature-dashboard, feature-settings]
```

## Exclusion Patterns

You can exclude specific files or directories from architectural checks using standard glob patterns in your layer definitions. 

**Note**: Intent Guard currently focuses on inclusion via `path`. To exclude test files from being considered part of the "production" layer logic (if they are colocated), you might need to structure your globs carefully or rely on the tool's default ignorance of `.git` and `node_modules`.

*Future versions will support explicit `exclude` fields in layer definitions.*

## Scoped Protected Regions

Protected regions are powerful for preserving manual code or security-critical logic.

### protecting CI Workflows

```yaml
protectedRegions:
  - path: .github/workflows/**
    reason: "CI pipelines are managed by DevOps team"
    aiMutable: false
```

### Protecting Configuration Files

```yaml
protectedRegions:
  - path: intent.config.yaml
    reason: "Architecture rules should not be self-modified by AI"
    aiMutable: false
```

## CI/CD Integration

Intent Guard is designed to run in your CI pipeline to prevent architecture drift.

### GitHub Actions Example

```yaml
name: Intent Guard Check
on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run Intent Guard
        run: npx intent-guard validate
```

### Pre-commit Hook (Husky)

Add this to your `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx intent-guard validate --diff
```
