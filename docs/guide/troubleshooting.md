# Troubleshooting

Common issues and their solutions when using Intent Guard.

## Installation Issues

### ❌ "Configuration file not found"

**Problem**: Intent Guard can't find `.intentguard/intent.config.yaml`

**Solution**:
```bash
# Make sure you're in the project root
cd /path/to/your/project

# Initialize if not done
npx intent-guard init

# Verify file exists
ls .intentguard/intent.config.yaml
```

### ❌ "--diff mode requires a git repository"

**Problem**: You're using `--diff` in a non-git project

**Solution**:
```bash
# Option 1: Initialize git
git init

# Option 2: Use full validation (slower)
npx intent-guard validate
```

## Validation Errors

### ❌ "Layer 'X' cannot import from layer 'Y'"

**Problem**: Your code violates layer boundaries

**Solution**:
1. Check your `intent.config.yaml` to see allowed imports
2. Either fix the import or update your architecture rules
3. Use `rules-for` to see what's allowed:
   ```bash
   npx intent-guard rules-for src/your-file.ts
   ```

**Example**:
```yaml
# Check your config
architecture:
  layers:
    - name: domain
      path: src/domain/**
      canImportFrom: []  # Domain can't import anything

# If domain tries to import infrastructure, it fails
```

### ❌ "Protected region modification detected"

**Problem**: AI modified code inside a protected region

**Solution**:
```bash
# Revert the protected block changes
git checkout HEAD -- path/to/file.ts

# Or remove protection if intentional:
# Edit intent.config.yaml and set aiMutable: true
```

### ❌ "Banned dependency detected"

**Problem**: Code imports a banned package

**Solution**:
1. Check `bannedDependencies` in your config
2. Use the suggested alternative
3. Or remove the ban if it's no longer needed

**Example**:
```yaml
bannedDependencies:
  - package: moment
    reason: "Use date-fns instead"
    alternatives: [date-fns]
```

## Performance Issues

### Problem: Validation is too slow

**For large codebases (1000+ files)**:

1. **Always use `--diff` mode** during development:
   ```bash
   npm run validate:diff  # 50-100x faster
   ```

2. **Use full validation only in CI**:
   ```jsonc
   {
     "scripts": {
       "validate": "intent-guard validate",      // CI only
       "validate:dev": "intent-guard validate --diff"  // Development
     }
   }
   ```

3. **Exclude generated files** (future feature):
   ```yaml
   # Add to your config
   exclude:
     - "**/*.generated.ts"
     - "**/dist/**"
     - "**/node_modules/**"
   ```

## Configuration Issues

### Problem: Glob pattern not matching files

**Solution**: Test your glob patterns

```bash
# Use a glob testing tool
npx glob "src/domain/**" --cwd .

# Or use ls to verify
ls src/domain/**
```

**Common mistakes**:
```yaml
# Wrong - missing **
path: src/domain

# Correct - matches all files in domain
path: src/domain/**
```

### Problem: Too many violations

**Solution**: Start with loose rules, tighten over time

```yaml
# Start here (permissive)
architecture:
  layers:
    - name: frontend
      path: src/frontend/**
      canImportFrom: [backend, shared]

# Gradually tighten (stricter)
architecture:
  layers:
    - name: frontend
      path: src/frontend/**
      canImportFrom: [shared]  # Removed backend
```

### Problem: Circular dependencies

**Issue**: Two layers depend on each other

```yaml
# Bad - circular dependency
- name: a
  canImportFrom: [b]
- name: b
  canImportFrom: [a]  # ❌ Circular!
```

**Solution**: Refactor your architecture

```yaml
# Good - one-way dependency
- name: a
  canImportFrom: [b]
- name: b
  canImportFrom: []  # ✅ No circular dependency

# Or extract shared code
- name: a
  canImportFrom: [shared]
- name: b
  canImportFrom: [shared]
- name: shared
  canImportFrom: []
```

## Git Integration Issues

### Problem: Pre-commit hook not running

**Solution**:
```bash
# Make sure husky is installed
npm install --save-dev husky

# Initialize husky
npx husky init

# Verify hook exists
cat .husky/pre-commit

# Make it executable (Unix/Mac)
chmod +x .husky/pre-commit
```

### Problem: `--diff` not detecting changes

**Solution**:
```bash
# Make sure files are staged
git add .

# Then run validation
npx intent-guard validate --diff

# Or check git status
git status
```

## CI/CD Issues

### Problem: Validation fails in CI but passes locally

**Possible causes**:

1. **Different Node versions**
   ```yaml
   # Use same Node version in CI
   - uses: actions/setup-node@v3
     with:
       node-version: '18'  # Match your local version
   ```

2. **Missing dependencies**
   ```yaml
   # Make sure to install dependencies
   - run: npm ci  # Not npm install
   ```

3. **Different git state**
   ```bash
   # In CI, use full validation
   npx intent-guard validate  # Not --diff
   ```

## AI Integration Issues

### Problem: AI keeps violating the same rules

**Solution**: Use Just-In-Time Context

```bash
# Before AI generates code
npx intent-guard rules-for src/your-file.ts

# AI reads the output and follows the rules
```

**Add to your AI instructions**:
```
Before modifying any file:
1. Run: npx intent-guard rules-for <file-path>
2. Follow the architectural rules shown
3. After changes, run: npx intent-guard validate --diff
```

### Problem: AI doesn't understand validation errors

**Solution**: Use JSON format

```bash
# JSON output is easier for AI to parse
npx intent-guard validate --format json
```

## Debugging Tips

### Enable Verbose Logging

```bash
# Add --verbose flag (future feature)
npx intent-guard validate --verbose
```

### Check Configuration Syntax

```bash
# Validate YAML syntax
npx js-yaml .intentguard/intent.config.yaml
```

### Test Individual Files

```bash
# Check rules for a specific file
npx intent-guard rules-for src/your-file.ts

# Output shows:
# - Which layer the file belongs to
# - What it can import
# - If it's protected
# - Banned dependencies
```

## Getting Help

### 🐞 Found a Bug?
[Report a bug](https://github.com/muthukumar-js-dev/intent-guard/issues/new?template=bug_report.yml) with:
- Your `intent.config.yaml`
- The command you ran
- The error message
- Your project structure

### ❓ Have a Question?
- [Ask in Discussions](https://github.com/muthukumar-js-dev/intent-guard/discussions)
- [Quick questions](https://github.com/muthukumar-js-dev/intent-guard/issues/new?template=question.yml)

### 💡 Feature Request?
[Request a feature](https://github.com/muthukumar-js-dev/intent-guard/issues/new?template=feature_request.yml)

## Common Workarounds

### Temporarily Disable Validation

```bash
# Skip validation in git hook
SKIP_VALIDATION=1 git commit -m "message"

# Or remove from pre-commit hook temporarily
```

### Ignore Specific Files

```yaml
# Use glob patterns to exclude files
architecture:
  layers:
    - name: domain
      path: src/domain/**
      # Exclude test files
      exclude: src/domain/**/*.test.ts
```

### Reset Architectural Baseline

```bash
# If you've fixed violations and want to reset
npx intent-guard validate --baseline
```

## FAQ

### Q: Does this replace ESLint?
**A**: No. ESLint checks for syntax and style errors. Intent Guard checks for **architectural violations**. Use both together.

### Q: Can I use it in a monorepo?
**A**: Yes! You can define a global architecture in the root, or specific rules for each package.

### Q: Is my code sent to the cloud?
**A**: No. Intent Guard runs **locally** on your machine. Your code never leaves your computer.

### Q: What if I need to violate a rule temporarily?
**A**: You can:
1. Adjust the rule in `intent.config.yaml`
2. Use `--baseline` to accept current state
3. Skip validation for that commit (not recommended)
