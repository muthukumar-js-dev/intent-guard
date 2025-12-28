# Troubleshooting Guide

This guide helps you resolve common issues encountered when using Intent Guard.

## Table of Contents
1. [Configuration Errors](#configuration-errors)
2. [Validation Errors](#validation-errors)
3. [CLI Issues](#cli-issues)

---

## Configuration Errors

### "Config file not found"
**Error**: `Error: Could not find configuration file at .intentguard/intent.config.yaml`
**Solution**: Run `npx intent-guard init` to generate a default configuration file, or ensure your config file is named correctly and placed in the `.intentguard` directory.

### "Invalid Config Schema"
**Error**: `ValidationError: "architecture.layers[0].name" is required`
**Solution**: Your `intent.config.yaml` does not match the expected schema. Check the [Configuration Reference](./configuration.md) for the correct structure.

---

## Validation Errors

### "Layer Violation Detected"
**Error**: `Error: Layer violation: src/features/auth/login.ts imports src/features/dashboard/widget.ts`
**Solution**:
1. Check your `intent.config.yaml` architecture definitions.
2. The file `login.ts` belongs to a layer that is NOT allowed to import from the layer containing `widget.ts`.
3. **Fix**: Refactor the code to move shared logic to a lower layer (e.g., `shared-kernel`) or update your architecture rules if this dependency is intended.

### "Protected Region Modified"
**Error**: `Error: Protected file modified: src/core/security/auth.ts`
**Solution**:
1. You are running validation with the `--diff` flag (default in CI).
2. A file in a `protectedRegion` has been changed.
3. **Fix**: Revert the changes to the protected file. If the change is intentional and you are a human developer, you can bypass this locally, but CI might still fail. To update protected code, ensure you have the necessary approvals or update the `protectedRegions` config temporarily (not recommended).

---

## CLI Issues

### "UNKNOWN_ERROR" during parsing
**Symptoms**: The tool crashes with a stack trace referring to `AST Parser`.
**Solution**:
- Intent Guard uses Babel/Parser. Ensure your code is valid TypeScript/JavaScript.
- If you are using experimental syntax not yet supported, please file an issue.
- **Debug**: Run with verbose logging to see which file caused the crash:
  ```bash
  npx intent-guard validate --verbose 
  ```

### Performance is slow
**Solution**:
- Ensure you are ignoring large directories like `node_modules` (handled by default) or build outputs (`dist`, `build`).
- Caching implementations (Planned for Phase 2) will significantly improve speed for incremental checks.
