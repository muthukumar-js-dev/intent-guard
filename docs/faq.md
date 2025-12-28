# Frequently Asked Questions

### Can I use Intent Guard with JavaScript projects?
Yes! Intent Guard supports both JavaScript and TypeScript. The parser automatically detects file types based on extensions.

### How is this different from ESLint?
ESLint is primarily a linter for *code style* and *local* best practices (e.g., "don't use unused variables"). Intent Guard is an *architectural* linter. It validates high-level relationships between files and modules (e.g., "The UI layer should never import from the Database layer"). While there is some overlap (like `eslint-plugin-import`), Intent Guard provides a more centralized and configuration-driven approach to architecture.

### Does it support aliases (e.g. `@src/`)?
Yes, Intent Guard attempts to resolve paths. However, for complex alias setups (like heavily customized tsconfig paths), you might need to ensure your standard resolution strategies are standard. We are improving advanced alias support in upcoming versions.

### Can I ignore specific files?
Yes, Intent Guard automatically ignores `node_modules` and `.git`. You can also configure specific exclusions in future versions. For now, architecture layers are inclusive (defined by what matches the glob), so files not matching your layer globs are effectively "unarchitected" and ignored by layer checks.

### Why is the `--diff` flag important?
The `--diff` flag allows Intent Guard to check for changes *against git*. This is crucial for the "Protected Regions" feature, which specifically guards against *modifications* to files. Without `--diff`, it can only validate static structure.

### Is it fast enough for large mono-repos?
Performance is a key priority. We are actively working on incremental caching (Phase 2) to ensure it scales to massive codebases. Currently, it parses files on every run, which is fast for small-to-medium projects but may take time for very large ones.
