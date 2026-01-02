# Configuration Guide

Complete guide to configuring Intent Guard for your project.

## Configuration File Location

The configuration file is located at `.intentguard/intent.config.yaml`.

## Schema Version

```yaml
version: '1.0.0'
```

Always start your configuration with the version number.

## Architecture Layers

Define strict architectural layers and their allowed dependencies.

### Basic Structure

```yaml
architecture:
  layers:
    - name: <layer-name>     # Unique identifier
      path: <glob-pattern>   # File path pattern
      canImportFrom:         # List of allowed layer names
        - <layer-name>
      cannotImportFrom:      # Explicitly forbidden imports (optional)
        - <layer-name>
```

### Example: Clean Architecture

```yaml
architecture:
  layers:
    - name: domain
      path: src/domain/**
      canImportFrom: []  # Core layer, no dependencies
      cannotImportFrom: [infrastructure]  # Explicitly forbid
    
    - name: application
      path: src/application/**
      canImportFrom: [domain]
      cannotImportFrom: [infrastructure]
    
    - name: infrastructure
      path: src/infra/**
      canImportFrom: [application, domain]
```

### Glob Patterns

Intent Guard uses glob patterns to match files:

- `**` - Matches any number of directories
- `*` - Matches any characters except `/`
- `?` - Matches a single character

**Examples**:
```yaml
src/domain/**          # All files in domain and subdirectories
src/components/*.tsx   # Only .tsx files directly in components
src/**/utils.ts        # Any utils.ts file anywhere in src
```

### Layer Dependencies

#### `canImportFrom`
Whitelist of layers this layer can import from.

```yaml
- name: ui
  path: src/ui/**
  canImportFrom: [services, utils]  # Can only import from these layers
```

#### `cannotImportFrom`
Explicit blacklist (optional, for clarity).

```yaml
- name: domain
  path: src/domain/**
  canImportFrom: []
  cannotImportFrom: [infrastructure]  # Make intent explicit
```

**Note**: If a layer is not in `canImportFrom`, it's already forbidden. `cannotImportFrom` makes the intent clearer.

## Protected Regions

> **⚠️ Note**: Protected regions require `--diff` mode to function properly.

Protect specific files or directories from AI modification.

### Basic Structure

```yaml
protectedRegions:
  - path: <glob-pattern>   # e.g., src/core/security/**
    reason: <string>       # Explanation for the protection
    aiMutable: false       # MUST be false to protect
```

### Examples

```yaml
protectedRegions:
  - path: src/core/security/**
    reason: 'Security-critical code requires manual review'
    aiMutable: false
  
  - path: src/database/migrations/**
    reason: 'Database migrations are immutable'
    aiMutable: false
  
  - path: src/payments/stripe.ts
    reason: 'Payment processing - audited code'
    aiMutable: false
```

### How It Works

When you run `npx intent-guard validate --diff`, Intent Guard:
1. Checks which files have changed (via git diff)
2. Compares changed files against protected regions
3. Fails validation if a protected file was modified

### Block-Level Protection

You can also protect specific code blocks within a file:

```typescript
// src/config/api-keys.ts

export const PUBLIC_KEY = "pk_live_...";

// #protected-start
export const SECRET_KEY = "sk_live_...";
export const WEBHOOK_SECRET = "whsec_...";
// #protected-end
```

AI can modify the file, but **cannot change the protected block**.

## Banned Dependencies

Prevent usage of specific external packages or internal modules.

### Basic Structure

```yaml
bannedDependencies:
  - package: <package-name>    # e.g., lodash
    reason: <string>           # Why it is banned
    alternatives: [<string>]   # Suggested alternatives
```

### Examples

```yaml
bannedDependencies:
  # Deprecated packages
  - package: moment
    reason: "Deprecated and large bundle size"
    alternatives: [date-fns, dayjs]
  
  - package: request
    reason: "Deprecated - no longer maintained"
    alternatives: [axios, node-fetch, got]
  
  # Performance
  - package: lodash
    reason: "Use lodash-es for tree-shaking"
    alternatives: [lodash-es]
  
  # Pattern matching
  - pattern: "^@types/.*"
    reason: "Types should be in devDependencies"
    alternatives: []
```

### Package vs Pattern

- **package**: Exact package name match
- **pattern**: Regular expression pattern

```yaml
# Exact match
- package: moment
  reason: "Use date-fns"
  alternatives: [date-fns]

# Pattern match
- pattern: "^@types/.*"
  reason: "Types in devDependencies only"
  alternatives: []
```

## Complete Configuration Example

```yaml
version: "1.0.0"

# Clean Architecture Pattern
# Dependency Flow: UI → Application → Domain ← Infrastructure

architecture:
  layers:
    # Domain Layer (Core Business Logic)
    - name: domain
      path: src/domain/**
      canImportFrom: []
      # Pure business logic - no external dependencies
    
    # Application Layer (Use Cases)
    - name: application
      path: src/application/**
      canImportFrom: [domain]
      # Orchestrates domain logic
    
    # Infrastructure Layer (External Services)
    - name: infrastructure
      path: src/infrastructure/**
      canImportFrom: [domain, application]
      # Implements interfaces defined in domain
    
    # UI Layer (Presentation)
    - name: ui
      path: src/ui/**
      canImportFrom: [application, domain]
      # Uses application services and domain models

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

bannedDependencies:
  # Deprecated
  - package: moment
    reason: "Deprecated and large bundle size"
    alternatives: [date-fns, dayjs]
  
  - package: request
    reason: "Deprecated - no longer maintained"
    alternatives: [axios, node-fetch, got]
  
  # Performance
  - package: lodash
    reason: "Use lodash-es for tree-shaking"
    alternatives: [lodash-es]
```

## Configuration Best Practices

### 1. Start Simple

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

Add comments to your config:

```yaml
# Clean Architecture Pattern
# Flow: UI → Application → Domain ← Infrastructure

architecture:
  layers:
    - name: ui
      path: src/ui/**
      canImportFrom: [application, domain]
      # UI can use application services and domain models
```

### 4. Protect Critical Code Early

Identify and protect your most critical files immediately:

```yaml
protectedRegions:
  # Security-critical
  - path: src/auth/**
    reason: "Authentication logic - security review required"
    aiMutable: false
```

### 5. Be Specific with Glob Patterns

```yaml
# Too broad
path: src/**

# Better
path: src/domain/**

# Even better
path: src/domain/entities/**
```

## Validation

After creating your config, test it:

```bash
# 1. Run validation
npx intent-guard validate

# 2. Check for existing violations
# If violations exist, decide:
# - Fix the code to match architecture
# - Adjust rules to match reality

# 3. Test with --diff mode
npx intent-guard validate --diff
```

## Advanced Patterns

### Monorepo Configuration

#### Global Configuration
Place `.intentguard/intent.config.yaml` at the monorepo root:

```yaml
architecture:
  layers:
    - name: app
      path: packages/app/**
      canImportFrom: [ui-kit, shared]
    
    - name: ui-kit
      path: packages/ui-kit/**
      canImportFrom: [shared]
    
    - name: shared
      path: packages/shared/**
      canImportFrom: []
```

#### Per-Package Configuration
Each package can have its own `.intentguard/` folder:

```
packages/
  ├── app/
  │   └── .intentguard/
  │       └── intent.config.yaml
  └── ui-kit/
      └── .intentguard/
          └── intent.config.yaml
```

### Feature-Based Architecture

```yaml
architecture:
  layers:
    - name: auth-feature
      path: src/features/auth/**
      canImportFrom: [shared-utils, shared-types]
    
    - name: user-feature
      path: src/features/user/**
      canImportFrom: [shared-utils, shared-types]
    
    - name: shared-utils
      path: src/shared/utils/**
      canImportFrom: [shared-types]
    
    - name: shared-types
      path: src/shared/types/**
      canImportFrom: []
```

## Troubleshooting Configuration

### Issue: Too Many Violations

**Solution**: Start with loose rules, tighten over time.

```yaml
# Start here
architecture:
  layers:
    - name: frontend
      path: src/frontend/**
      canImportFrom: [backend, shared]  # Permissive

# Gradually tighten
architecture:
  layers:
    - name: frontend
      path: src/frontend/**
      canImportFrom: [shared]  # Stricter
```

### Issue: Glob Pattern Not Matching

Test your glob patterns:

```bash
# Use a glob testing tool
npx glob "src/domain/**" --cwd .
```

### Issue: Circular Dependencies

If you have circular dependencies, your architecture needs refactoring:

```yaml
# Bad - circular dependency
- name: a
  canImportFrom: [b]
- name: b
  canImportFrom: [a]  # ❌ Circular!

# Good - one-way dependency
- name: a
  canImportFrom: [b]
- name: b
  canImportFrom: []  # ✅ No circular dependency
```
