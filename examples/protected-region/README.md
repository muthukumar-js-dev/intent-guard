# Protected Region Example

This project demonstrates how to mark files as protected from AI modification.

## Configuration

- **src/core/types.ts**: Marked as `aiMutable: false` in `.intentguard/intent.config.yaml`

## Usage

### Check Protection Status
```bash
npx intent-guard rules-for src/core/types.ts
```

This will show that the file is protected:
```json
{
  "file": "src\\core\\types.ts",
  "isProtected": true,
  "protectedReason": "Critical types"
}
```

### Validate Protected Regions

**Important**: Protected regions validation requires `--diff` mode to work correctly.

```bash
# First, ensure you have a git repository
git init
git add .
git commit -m "Initial commit"

# Run validation (should pass with no violations)
npx intent-guard validate --diff
```

### Test Protection Detection

To see protected region violations in action:

```bash
# 1. Make a change to the protected file
echo "// Modified" >> src/core/types.ts

# 2. Run validation with --diff
npx intent-guard validate --diff
```

You should see a violation like:
```
✗ Protected region violation
  File: src/core/types.ts
  Reason: Critical types
  This file is marked as aiMutable: false
```

## How It Works

Protected regions are validated by comparing the current state of files against their git history. This is why `--diff` mode is required - it allows the validator to detect which files have been modified and check if any of them are marked as protected.
