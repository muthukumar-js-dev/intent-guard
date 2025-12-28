# P0 Task 3: Fix Documentation Drift

**Priority**: P0 (Critical)  
**Estimated Time**: 30 minutes  
**Complexity**: Low  
**Category**: Documentation Fix

---

## Problem Statement

The documentation has **drifted from the actual implementation**, documenting features that don't exist and missing features that do exist. This creates confusion for users.

**Issues Found**:
1. `docs/cli-reference.md` documents `--config` option that doesn't exist
2. Missing documentation for `--diff` option (after implementing P0 Task 2)
3. `cannotImportFrom` is in schema but not documented
4. Protected regions documented as working (but broken until P0 Task 1)

---

## Changes Required

### 1. Fix CLI Reference Documentation

**File**: `docs/cli-reference.md`

**Current (INCORRECT)**:
```markdown
**Options:**
- `--config <path>`: Path to custom config file.
- `--format <json|text>`: Output format (default: `text`).
```

**Fixed**:
```markdown
**Options:**
- `--format <json|text>`: Output format (default: `text`)
- `--diff`: Validate only changed files (requires git)

**Examples:**
```bash
# Validate entire codebase
npx intent-guard validate

# Validate only changed files
npx intent-guard validate --diff

# JSON output for CI/CD
npx intent-guard validate --format json
```
```

### 2. Update Configuration Documentation

**File**: `docs/configuration.md`

Add `cannotImportFrom` documentation:

```markdown
## Architecture Layers

Define strict architectural layers and their allowed dependencies.

```yaml
architecture:
  layers:
    - name: <layer-name>
      path: <glob-pattern>
      canImportFrom: [<layer-names>]    # Allowed imports
      cannotImportFrom: [<layer-names>] # Explicitly forbidden imports (optional)
```

**Example:**
```yaml
architecture:
  layers:
    - name: domain
      path: src/domain/**
      canImportFrom: []
      cannotImportFrom: [infrastructure] # Explicitly forbid
    - name: application
      path: src/application/**
      canImportFrom: [domain]
      cannotImportFrom: [infrastructure]
    - name: infrastructure
      path: src/infrastructure/**
      canImportFrom: [application, domain]
```

**Note**: `cannotImportFrom` provides explicit forbidden imports. If a layer is not in `canImportFrom`, it's already forbidden, but `cannotImportFrom` makes the intent clearer.
```

### 3. Update Protected Regions Documentation

**File**: `docs/configuration.md`

Add note about current status:

```markdown
## Protected Regions

> **⚠️ Note**: Protected regions require `--diff` mode to function properly. This feature validates that protected files are not modified.

Protect specific files or directories from modification.

```yaml
protectedRegions:
  - path: <glob-pattern>
    reason: <string>
    aiMutable: false  # Must be false to protect
```

**Example:**
```yaml
protectedRegions:
  - path: src/core/security/**
    reason: "Security-critical code requires manual review"
    aiMutable: false
  - path: src/database/migrations/**
    reason: "Database migrations are immutable"
    aiMutable: false
```

**Usage:**
```bash
# Validate changed files (includes protected regions check)
npx intent-guard validate --diff
```
```

### 4. Update README

**File**: `README.md`

Clarify feature status:

```markdown
## 🚀 Key Features

- ✅ **Layer Boundary Enforcement**: Prevent violations (e.g., Domain importing Infrastructure)
- ✅ **Protected Regions**: Mark files as `aiMutable: false` to prevent modification (requires `--diff` mode)
- ✅ **Banned Dependencies**: Stop specific packages from creeping into your codebase
- ✅ **AI-Native**: Designed to be run by AI agents to self-correct their code
- ✅ **Fast Validation**: Use `--diff` mode to validate only changed files
```

### 5. Add Integration Guide Examples

**File**: `docs/integration.md`

Expand with concrete examples:

```markdown
# AI Integration Guide

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

## Using in Pre-Commit Hooks

**File**: `.husky/pre-commit`

```bash
#!/bin/sh
npx intent-guard validate --diff || exit 1
```

## Using in CI/CD

**GitHub Actions**:

```yaml
- name: Validate Architecture
  run: npx intent-guard validate --diff
```

**GitLab CI**:

```yaml
validate:
  script:
    - npx intent-guard validate --diff
```
```

---

## Implementation Steps

### Step 1: Update CLI Reference

1. Open `docs/cli-reference.md`
2. Remove `--config` option
3. Add `--diff` option with examples
4. Add exit codes section if missing

### Step 2: Update Configuration Reference

1. Open `docs/configuration.md`
2. Add `cannotImportFrom` documentation
3. Update protected regions with note about `--diff` requirement
4. Add complete examples

### Step 3: Update README

1. Open `README.md`
2. Update features list with accurate status
3. Add `--diff` mode to quick start
4. Ensure all examples are correct

### Step 4: Expand Integration Guide

1. Open `docs/integration.md`
2. Add concrete examples for Cursor, Windsurf
3. Add pre-commit hook example
4. Add CI/CD examples

### Step 5: Verify All Links

Check that all internal links work:
- README links to docs/
- Cross-references between docs

---

## Validation Steps

### 1. Check for Broken Links

```bash
# Use markdown link checker (if available)
npx markdown-link-check docs/*.md README.md
```

### 2. Verify Examples Work

Test each example command:

```bash
# From README
npx intent-guard init
npx intent-guard validate
npx intent-guard validate --diff

# From CLI reference
npx intent-guard rules-for src/index.ts
```

### 3. Review Documentation Consistency

- [ ] All CLI options documented match actual implementation
- [ ] All config options documented match schema
- [ ] Examples use correct syntax
- [ ] No references to non-existent features

### 4. Check Formatting

```bash
# Run prettier on markdown files
npx prettier --write "docs/**/*.md" README.md
```

---

## Success Criteria

- ✅ No documentation of non-existent features
- ✅ All actual features are documented
- ✅ Examples are accurate and tested
- ✅ Clear notes about feature requirements (e.g., git for --diff)
- ✅ Integration guide has concrete examples
- ✅ All links work
- ✅ Consistent formatting

---

## Files to Update

1. `docs/cli-reference.md` - Fix options, add examples
2. `docs/configuration.md` - Add cannotImportFrom, update protected regions
3. `docs/integration.md` - Expand with examples
4. `README.md` - Update features, add --diff to quick start

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
