# P0 Task 1: Fix or Remove Protected Regions Feature

**Priority**: P0 (Critical)  
**Estimated Time**: 1-4 hours  
**Complexity**: Medium  
**Category**: Bug Fix / Feature Decision

---

## Problem Statement

The protected regions validator is **non-functional** in the current MVP implementation. The validator requires a `changedFiles` parameter to work, but the CLI never provides this parameter, making the feature completely broken.

**Current Behavior**:
- `ProtectedRegionsValidator.validate()` accepts optional `changedFiles` parameter
- If `changedFiles` is not provided, validator returns no violations (always passes)
- CLI's `ValidateCommand` never passes `changedFiles` to the validator
- Example project `examples/protected-region/` doesn't demonstrate working feature

**Impact**:
- Feature is advertised but doesn't work
- Users will be confused when protected files can be modified
- Example project is misleading

---

## Context

### Current Implementation

**File**: `src/core/validators/protected-regions-validator.ts`

```typescript
async validate(changedFiles?: string[]): Promise<ValidationResult> {
    // ...
    for (const file of matchedFiles) {
        // If changedFiles is provided, only check changed files
        if (changedFiles && !changedFiles.includes(file)) continue;
        
        violations.push({...}); // Creates violation
    }
}
```

**Problem**: Without `changedFiles`, the loop never creates violations.

**File**: `src/cli/commands/validate-command.ts`

```typescript
const protectedValidator = new ProtectedRegionsValidator(this.config, this.projectRoot);
results.push(await protectedValidator.validate()); // No changedFiles passed!
```

---

## Decision Required

You must choose **ONE** of the following options:

### Option A: Remove Feature from v0.1.0 (Recommended)

**Rationale**:
- Feature requires git integration (not in MVP scope)
- Conceptually unclear how AI knows what it changed
- Better to ship working features than broken ones

**Effort**: 1 hour

**Changes Required**:
1. Remove `ProtectedRegionsValidator` from `ValidateCommand`
2. Remove `examples/protected-region/` directory
3. Update documentation to mark as "Coming in v0.2.0"
4. Add to roadmap in README

### Option B: Implement Git Integration

**Rationale**:
- Makes feature functional
- Provides real value for AI-assisted development
- Requires external dependency on git

**Effort**: 4 hours

**Changes Required**:
1. Add git integration utility
2. Implement `--diff` mode to detect changed files
3. Update `ValidateCommand` to pass `changedFiles`
4. Add tests for git integration
5. Update documentation

---

## Implementation Steps

### If Choosing Option A (Remove Feature)

#### Step 1: Remove Validator from CLI

**File**: `src/cli/commands/validate-command.ts`

Remove lines 40-42:
```typescript
// 2. Protected Regions Validator
const protectedValidator = new ProtectedRegionsValidator(this.config, this.projectRoot);
results.push(await protectedValidator.validate());
```

#### Step 2: Keep Validator Code (for future use)

Do NOT delete `src/core/validators/protected-regions-validator.ts` - keep it for v0.2.0.

#### Step 3: Remove Example Project

```bash
rm -rf examples/protected-region/
```

#### Step 4: Update Documentation

**File**: `README.md`

Add to features section:
```markdown
## 🚀 Key Features

- **Layer Boundary Enforcement**: Prevent violations ✅
- **Banned Dependencies**: Stop unwanted packages ✅
- **Protected Regions**: Coming in v0.2.0 🚧
```

**File**: `docs/configuration.md`

Add note:
```markdown
## Protected Regions (Coming Soon)

> **Note**: Protected regions are planned for v0.2.0. The validator exists but requires git integration to function properly.
```

#### Step 5: Update Roadmap

**File**: `README.md`

Add roadmap section:
```markdown
## 🗺️ Roadmap

### v0.2.0 (Planned)
- ✅ Protected regions with git integration
- ✅ `--diff` mode for incremental validation
- ✅ Dynamic import detection
```

#### Step 6: Update Tests

Remove or skip protected regions integration tests:

**File**: `tests/integration/cli/validate-command.test.ts`

Comment out or remove protected regions test cases.

---

### If Choosing Option B (Implement Git Integration)

#### Step 1: Create Git Utility

**File**: `src/utils/git.ts`

```typescript
import { execSync } from 'child_process';
import * as path from 'path';

export class GitUtils {
    /**
     * Get list of changed files using git diff
     * @param projectRoot - Project root directory
     * @param base - Base branch/commit (default: HEAD)
     * @returns Array of absolute file paths
     */
    static getChangedFiles(projectRoot: string, base: string = 'HEAD'): string[] {
        try {
            const output = execSync(`git diff --name-only ${base}`, {
                cwd: projectRoot,
                encoding: 'utf-8',
            });

            return output
                .split('\n')
                .filter(Boolean)
                .map((file) => path.resolve(projectRoot, file));
        } catch (error) {
            // Not a git repository or git not installed
            return [];
        }
    }

    /**
     * Check if directory is a git repository
     */
    static isGitRepository(projectRoot: string): boolean {
        try {
            execSync('git rev-parse --git-dir', {
                cwd: projectRoot,
                stdio: 'ignore',
            });
            return true;
        } catch {
            return false;
        }
    }
}
```

#### Step 2: Update ValidateCommand

**File**: `src/cli/commands/validate-command.ts`

```typescript
import { GitUtils } from '../../utils/git';

async execute(options: ValidateOptions = {}): Promise<void> {
    // ... existing code ...

    // Get changed files if --diff mode
    let changedFiles: string[] | undefined;
    if (options.diff) {
        if (!GitUtils.isGitRepository(this.projectRoot)) {
            console.error(chalk.red('--diff mode requires a git repository'));
            process.exit(1);
        }
        changedFiles = GitUtils.getChangedFiles(this.projectRoot);
        console.log(chalk.blue(`Analyzing ${changedFiles.length} changed files...`));
    }

    // ... existing code ...

    // 2. Protected Regions Validator
    const protectedValidator = new ProtectedRegionsValidator(this.config, this.projectRoot);
    results.push(await protectedValidator.validate(changedFiles));

    // ... rest of code ...
}
```

#### Step 3: Update Protected Regions Validator Logic

**File**: `src/core/validators/protected-regions-validator.ts`

Change validation logic:

```typescript
async validate(changedFiles?: string[]): Promise<ValidationResult> {
    const violations: Violation[] = [];

    if (!this.config.protectedRegions || this.config.protectedRegions.length === 0) {
        return {
            valid: true,
            violations: [],
            summary: { errors: 0, warnings: 0, filesAnalyzed: 0 },
        };
    }

    for (const region of this.config.protectedRegions) {
        if (region.aiMutable) continue;

        const matchedFiles = await this.findMatchingFiles(region.path);

        for (const file of matchedFiles) {
            // If changedFiles provided, only check those files
            // If not provided, check all matched files (strict mode)
            if (changedFiles && !changedFiles.includes(file)) {
                continue;
            }

            // If no changedFiles list, warn about all protected files
            violations.push({
                ruleId: 'protected-region',
                severity: changedFiles ? 'error' : 'warning',
                file,
                message: `Protected region: ${region.reason}`,
                suggestion: changedFiles 
                    ? 'This file cannot be modified. Revert changes.'
                    : 'This file is protected. Use --diff mode to validate changes.',
                autoFixable: false,
            });
        }
    }

    return {
        valid: violations.filter(v => v.severity === 'error').length === 0,
        violations,
        summary: {
            errors: violations.filter((v) => v.severity === 'error').length,
            warnings: violations.filter((v) => v.severity === 'warning').length,
            filesAnalyzed: changedFiles?.length ?? matchedFiles.length,
        },
    };
}
```

#### Step 4: Add Tests

**File**: `tests/unit/utils/git.test.ts`

```typescript
import { GitUtils } from '../../../src/utils/git';

describe('GitUtils', () => {
    describe('isGitRepository', () => {
        it('should return true for git repository', () => {
            const result = GitUtils.isGitRepository(process.cwd());
            expect(result).toBe(true);
        });

        it('should return false for non-git directory', () => {
            const result = GitUtils.isGitRepository('/tmp');
            expect(result).toBe(false);
        });
    });

    describe('getChangedFiles', () => {
        it('should return array of changed files', () => {
            const files = GitUtils.getChangedFiles(process.cwd());
            expect(Array.isArray(files)).toBe(true);
        });

        it('should return empty array for non-git directory', () => {
            const files = GitUtils.getChangedFiles('/tmp');
            expect(files).toEqual([]);
        });
    });
});
```

#### Step 5: Update Documentation

**File**: `docs/cli-reference.md`

Update validate command:
```markdown
## `validate`

**Options:**
- `--format <json|text>`: Output format (default: `text`)
- `--diff`: Validate only changed files (requires git)

**Examples:**
```bash
# Validate entire codebase
npx intent-guard validate

# Validate only changed files
npx intent-guard validate --diff
```
```

---

## Validation Steps

### For Option A (Remove)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Verify CLI works**:
   ```bash
   npx intent-guard validate
   ```

4. **Check examples**:
   ```bash
   ls examples/
   # Should NOT include protected-region/
   ```

5. **Verify documentation**:
   - Check README mentions "Coming in v0.2.0"
   - Check docs/configuration.md has note

### For Option B (Implement)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Test --diff mode**:
   ```bash
   # Make a change to a file
   echo "// test" >> src/index.ts
   
   # Run with --diff
   npx intent-guard validate --diff
   
   # Revert change
   git checkout src/index.ts
   ```

4. **Test protected regions**:
   ```bash
   cd examples/protected-region
   npx intent-guard validate --diff
   ```

5. **Verify git integration**:
   - Test in git repository (should work)
   - Test in non-git directory (should show error)

---

## Success Criteria

### For Option A
- ✅ Protected regions validator removed from CLI
- ✅ Example project removed
- ✅ Documentation updated with "Coming Soon"
- ✅ All tests pass
- ✅ No references to broken feature in user-facing docs

### For Option B
- ✅ Git utility implemented and tested
- ✅ `--diff` mode works correctly
- ✅ Protected regions validator functional
- ✅ All tests pass (including new git tests)
- ✅ Documentation updated with --diff examples
- ✅ Example project demonstrates working feature

---

## Common Pitfalls

1. **Don't delete the validator code** - Keep it for future use
2. **Update all documentation** - README, docs/, examples/
3. **Test both git and non-git scenarios** - Handle gracefully
4. **Consider Windows compatibility** - Git commands work on Windows?

---

## Recommendation

**Choose Option A** for v0.1.0. Reasons:
- Faster to implement (1 hour vs 4 hours)
- Avoids adding git dependency
- Honest about MVP scope
- Can properly implement in v0.2.0 with more thought

**Choose Option B** only if:
- Protected regions are critical for your use case
- You have time for proper git integration
- You can test on multiple platforms

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
