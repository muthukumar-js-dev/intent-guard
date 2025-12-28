# Configuration Reference

The configuration file is located at `.intentguard/intent.config.yaml`. For advanced patterns, see [Advanced Configuration](./advanced-configuration.md).

## Schema Version

```yaml
version: '1.0.0'
```

## Architecture Layers

Define strict architectural layers and their allowed dependencies.

```yaml
architecture:
  layers:
    - name: <layer-name> # Unique identifier
      path: <glob-pattern> # File path pattern (e.g., src/domain/**)
      canImportFrom: # List of allowed layer names
        - <layer-name>
      cannotImportFrom: # Explicitly forbidden imports (optional)
        - <layer-name>
```

**Example (Clean Architecture):**

```yaml
architecture:
  layers:
    - name: domain
      path: src/domain/**
      canImportFrom: [] # Core layer, no dependencies
      cannotImportFrom: [infrastructure] # Explicitly forbid
    - name: application
      path: src/application/**
      canImportFrom: [domain]
      cannotImportFrom: [infrastructure]
    - name: infrastructure
      path: src/infra/**
      canImportFrom: [application, domain]
```

**Note**: `cannotImportFrom` provides explicit forbidden imports. If a layer is not in `canImportFrom`, it's already forbidden, but `cannotImportFrom` makes the intent clearer.

## Protected Regions

> **⚠️ Note**: Protected regions require `--diff` mode to function properly. This feature validates that protected files are not modified.

Protect specific files or directories from AI modification.

```yaml
protectedRegions:
  - path: <glob-pattern> # e.g., src/core/security/**
    reason: <string> # Explanation for the protection
    aiMutable: false # MUST be false to protect
```

**Example:**

```yaml
protectedRegions:
  - path: src/core/security/**
    reason: 'Security-critical code requires manual review'
    aiMutable: false
  - path: src/database/migrations/**
    reason: 'Database migrations are immutable'
    aiMutable: false
```

**Usage:**

```bash
# Validate changed files (includes protected regions check)
npx intent-guard validate --diff
```

## Banned Dependencies

Prevent usage of specific external packages or internal modules.

```yaml
bannedDependencies:
  - package: <package-name> # e.g., lodash
    reason: <string> # Why it is banned
    alternatives: [<string>] # Suggested alternatives
```
