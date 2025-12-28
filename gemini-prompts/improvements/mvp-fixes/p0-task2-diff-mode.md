# P0 Task 2: Implement --diff Mode with Git Integration

**Priority**: P0 (Critical)  
**Estimated Time**: 3-4 hours  
**Complexity**: Medium-High  
**Category**: Feature Implementation

---

## Problem Statement

The `--diff` option is defined in the CLI but **not implemented**. This feature is critical for:
- Performance on large codebases (only validate changed files)
- CI/CD integration (validate PR changes)
- Developer workflow (quick validation during development)

**Current State**:
- CLI defines `--diff` option in `validate` command
- Option is parsed but never used
- All validators always analyze entire codebase

**Expected Behavior**:
- `npx intent-guard validate --diff` should only validate files changed since last commit
- Should integrate with git to detect changes
- Should fail gracefully if not in a git repository

---

## Context

### Current Implementation

**File**: `src/cli/index.ts` (lines 30-31)

```typescript
.option('-d, --diff', 'Validate only changed files (git diff)', false)
```

**File**: `src/cli/commands/validate-command.ts`

```typescript
interface ValidateOptions {
    format?: 'json' | 'text';
    diff?: boolean; // Defined but never used!
}
```

The `options.diff` is never checked or used in the execute method.

---

## Implementation Requirements

### 1. Git Integration Utility

Create a utility to interact with git and detect changed files.

**File**: `src/utils/git.ts` (NEW)

```typescript
import { execSync } from 'child_process';
import * as path from 'path';

export class GitUtils {
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

    /**
     * Get list of changed files using git diff
     * @param projectRoot - Project root directory
     * @param base - Base ref to compare against (default: 'HEAD')
     * @param includeUntracked - Include untracked files (default: true)
     * @returns Array of absolute file paths
     */
    static getChangedFiles(
        projectRoot: string,
        base: string = 'HEAD',
        includeUntracked: boolean = true
    ): string[] {
        try {
            const files: string[] = [];

            // Get modified and staged files
            const diffOutput = execSync(`git diff --name-only ${base}`, {
                cwd: projectRoot,
                encoding: 'utf-8',
            });

            files.push(...diffOutput.split('\n').filter(Boolean));

            // Get untracked files if requested
            if (includeUntracked) {
                const untrackedOutput = execSync('git ls-files --others --exclude-standard', {
                    cwd: projectRoot,
                    encoding: 'utf-8',
                });

                files.push(...untrackedOutput.split('\n').filter(Boolean));
            }

            // Convert to absolute paths and deduplicate
            const absolutePaths = files.map((file) => path.resolve(projectRoot, file));
            return [...new Set(absolutePaths)];
        } catch (error) {
            throw new Error(`Failed to get changed files: ${(error as Error).message}`);
        }
    }

    /**
     * Get files changed in current branch compared to main/master
     */
    static getBranchChangedFiles(projectRoot: string): string[] {
        try {
            // Try main first, then master
            const baseBranch = this.getBaseBranch(projectRoot);
            return this.getChangedFiles(projectRoot, baseBranch, true);
        } catch {
            // Fallback to HEAD if can't determine base branch
            return this.getChangedFiles(projectRoot, 'HEAD', true);
        }
    }

    /**
     * Determine base branch (main or master)
     */
    private static getBaseBranch(projectRoot: string): string {
        try {
            // Check if main exists
            execSync('git rev-parse --verify main', {
                cwd: projectRoot,
                stdio: 'ignore',
            });
            return 'main';
        } catch {
            // Fallback to master
            return 'master';
        }
    }
}
```

---

### 2. Update Dependency Graph Builder

Modify the graph builder to accept a file filter.

**File**: `src/core/graph/dependency-graph-builder.ts`

Add method to build graph for specific files only:

```typescript
/**
 * Build dependency graph for specific files only
 * @param filePaths - Array of absolute file paths to analyze
 */
async buildForFiles(filePaths: string[]): Promise<DependencyGraph> {
    const graph: DependencyGraph = {
        nodes: [],
        edges: [],
    };

    // Filter files that match layer patterns
    const relevantFiles = filePaths.filter((filePath) => {
        return this.config.architecture.layers.some((layer) => {
            const pattern = path.join(this.projectRoot, layer.path);
            return minimatch(filePath, pattern, { windowsPathsNoEscape: true });
        });
    });

    // Parse each file
    for (const filePath of relevantFiles) {
        await this.processFile(filePath, graph);
    }

    return graph;
}
```

---

### 3. Update ValidateCommand

Implement --diff mode logic in the validate command.

**File**: `src/cli/commands/validate-command.ts`

```typescript
import { GitUtils } from '../../utils/git';

async execute(options: ValidateOptions = {}): Promise<void> {
    const format = options.format || 'text';

    // Load config
    this.loadConfig();

    if (!this.config || !this.projectRoot) {
        console.error(chalk.red('Failed to load configuration'));
        process.exit(1);
    }

    // Determine which files to analyze
    let changedFiles: string[] | undefined;
    let graph: DependencyGraph;

    if (options.diff) {
        // Check if git repository
        if (!GitUtils.isGitRepository(this.projectRoot)) {
            console.error(
                chalk.red('Error: --diff mode requires a git repository') +
                '\n' +
                chalk.yellow('Tip: Initialize git with: git init')
            );
            process.exit(1);
        }

        // Get changed files
        try {
            changedFiles = GitUtils.getChangedFiles(this.projectRoot);
            
            if (changedFiles.length === 0) {
                console.log(chalk.green('✓ No changed files to validate'));
                return;
            }

            console.log(chalk.blue(`Analyzing ${changedFiles.length} changed file(s)...`));
            
            // Build graph for changed files only
            const graphBuilder = new DependencyGraphBuilder(this.config, this.projectRoot);
            graph = await graphBuilder.buildForFiles(changedFiles);
        } catch (error) {
            console.error(chalk.red(`Failed to get changed files: ${(error as Error).message}`));
            process.exit(1);
        }
    } else {
        // Analyze entire codebase
        const graphBuilder = new DependencyGraphBuilder(this.config, this.projectRoot);
        graph = await graphBuilder.build();
    }

    // Run all validators
    const results: ValidationResult[] = [];

    // 1. Layer Boundary Validator
    const layerValidator = new LayerBoundaryValidator(this.config, graph);
    results.push(layerValidator.validate());

    // 2. Protected Regions Validator (pass changedFiles if in diff mode)
    const protectedValidator = new ProtectedRegionsValidator(this.config, this.projectRoot);
    results.push(await protectedValidator.validate(changedFiles));

    // 3. Banned Dependencies Validator
    const bannedValidator = new BannedDependenciesValidator(this.config, graph);
    results.push(await bannedValidator.validate());

    // ... rest of existing code (aggregate results, output, exit) ...
}
```

---

## Implementation Steps

### Step 1: Create Git Utility

1. Create `src/utils/` directory if it doesn't exist
2. Create `src/utils/git.ts` with the implementation above
3. Create `src/utils/index.ts` to export GitUtils

**File**: `src/utils/index.ts` (NEW)

```typescript
export * from './git';
```

### Step 2: Add buildForFiles Method

Update `src/core/graph/dependency-graph-builder.ts`:

1. Add the `buildForFiles` method
2. Ensure it reuses existing `processFile` logic
3. Handle edge cases (empty file list, non-existent files)

### Step 3: Update ValidateCommand

Update `src/cli/commands/validate-command.ts`:

1. Import `GitUtils`
2. Add --diff mode logic before building graph
3. Pass `changedFiles` to protected regions validator
4. Add user-friendly messages for diff mode

### Step 4: Add Tests

**File**: `tests/unit/utils/git.test.ts` (NEW)

```typescript
import { GitUtils } from '../../../src/utils/git';
import * as path from 'path';

describe('GitUtils', () => {
    const projectRoot = process.cwd(); // Assuming tests run in git repo

    describe('isGitRepository', () => {
        it('should return true for git repository', () => {
            expect(GitUtils.isGitRepository(projectRoot)).toBe(true);
        });

        it('should return false for non-git directory', () => {
            expect(GitUtils.isGitRepository('/tmp')).toBe(false);
        });
    });

    describe('getChangedFiles', () => {
        it('should return array of file paths', () => {
            const files = GitUtils.getChangedFiles(projectRoot);
            expect(Array.isArray(files)).toBe(true);
        });

        it('should return absolute paths', () => {
            const files = GitUtils.getChangedFiles(projectRoot);
            files.forEach((file) => {
                expect(path.isAbsolute(file)).toBe(true);
            });
        });

        it('should throw error for non-git directory', () => {
            expect(() => {
                GitUtils.getChangedFiles('/tmp');
            }).toThrow();
        });
    });

    describe('getBranchChangedFiles', () => {
        it('should return files changed in current branch', () => {
            const files = GitUtils.getBranchChangedFiles(projectRoot);
            expect(Array.isArray(files)).toBe(true);
        });
    });
});
```

**File**: `tests/integration/cli/validate-command.test.ts`

Add test case for --diff mode:

```typescript
describe('ValidateCommand with --diff', () => {
    it('should validate only changed files', async () => {
        // This test requires git repository
        const cmd = new ValidateCommand();
        await expect(cmd.execute({ diff: true })).resolves.not.toThrow();
    });

    it('should fail gracefully in non-git directory', async () => {
        // Mock GitUtils.isGitRepository to return false
        jest.spyOn(GitUtils, 'isGitRepository').mockReturnValue(false);
        
        const cmd = new ValidateCommand();
        await expect(cmd.execute({ diff: true })).rejects.toThrow();
    });
});
```

### Step 5: Update Documentation

**File**: `docs/cli-reference.md`

Update validate command section:

```markdown
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

# Validate with JSON output
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
```

**File**: `README.md`

Add example in Quick Start:

```markdown
## ⚡ Quick Start

1. **Initialize** the configuration:
   ```bash
   npx intent-guard init
   ```

2. **Validate** your project:
   ```bash
   # Validate entire codebase
   npx intent-guard validate
   
   # Or validate only changed files (faster)
   npx intent-guard validate --diff
   ```
```

---

## Validation Steps

### 1. Build the Project

```bash
npm run build
```

### 2. Run Unit Tests

```bash
npm test -- tests/unit/utils/git.test.ts
```

### 3. Test --diff Mode Manually

```bash
# Make a change to a file
echo "// test change" >> src/index.ts

# Run validate with --diff
npx intent-guard validate --diff

# Should show analyzing changed files

# Revert change
git checkout src/index.ts
```

### 4. Test in Non-Git Directory

```bash
# Create temp directory
mkdir /tmp/test-no-git
cd /tmp/test-no-git

# Try to run --diff (should fail gracefully)
npx intent-guard validate --diff

# Should show error: "requires a git repository"
```

### 5. Test with No Changes

```bash
# Ensure working directory is clean
git status

# Run --diff
npx intent-guard validate --diff

# Should show: "No changed files to validate"
```

### 6. Run Full Test Suite

```bash
npm test
```

### 7. Test in Example Project

```bash
cd examples/clean-architecture

# Make a violation
echo "import { something } from '../infrastructure';" >> src/domain/user.ts

# Validate with --diff
npx intent-guard validate --diff

# Should detect violation

# Revert
git checkout src/domain/user.ts
```

---

## Success Criteria

- ✅ `GitUtils` class implemented and tested
- ✅ `buildForFiles` method added to DependencyGraphBuilder
- ✅ `--diff` mode works in ValidateCommand
- ✅ Graceful error when not in git repository
- ✅ Shows "No changed files" when working directory is clean
- ✅ Only analyzes changed files (performance improvement)
- ✅ All tests pass (unit + integration)
- ✅ Documentation updated with examples
- ✅ Works on Windows, macOS, and Linux

---

## Common Pitfalls

1. **Git not installed**: Handle gracefully with clear error message
2. **Windows path separators**: Use `path.resolve()` and normalize paths
3. **Untracked files**: Make sure to include them in changed files list
4. **Empty file list**: Handle case where no files changed
5. **Submodules**: Git commands might behave differently in submodules

---

## Edge Cases to Handle

1. **Not a git repository**: Show clear error, suggest `git init`
2. **Git not installed**: Catch exec error, show installation instructions
3. **No changes**: Exit gracefully with success message
4. **Binary files**: Git diff includes them, but parser should skip
5. **Deleted files**: Git diff shows them, but they don't exist (handle gracefully)

---

## Performance Impact

**Before** (full codebase):
- Parses all files matching layer patterns
- Can be slow on large projects (1000+ files)

**After** (--diff mode):
- Only parses changed files
- Typical PR: 5-20 files
- **~50-100x faster** for incremental validation

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
