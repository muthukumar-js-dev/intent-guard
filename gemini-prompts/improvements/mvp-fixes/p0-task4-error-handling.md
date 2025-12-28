# P0 Task 4: Add Global Error Handler

**Priority**: P0 (Critical)  
**Estimated Time**: 1 hour  
**Complexity**: Low-Medium  
**Category**: Error Handling

---

## Problem Statement

The CLI has **no global error handler**, causing uncaught errors to crash ungracefully with stack traces that confuse users.

**Current Behavior**:
```
Error: ENOENT: no such file or directory
    at Object.readFileSync (fs.js:...)
    at ConfigLoader.loadFromFile (/intent-guard/src/config/loader.ts:39:...)
    ... 20 more lines of stack trace ...
```

**Expected Behavior**:
```
✗ Error: Configuration file not found
  Expected: .intentguard/intent.config.yaml
  Run 'npx intent-guard init' to create configuration

For debugging, run with: DEBUG=1 npx intent-guard validate
```

---

## Implementation Requirements

### 1. Create Error Handler Utility

**File**: `src/cli/error-handler.ts` (NEW)

```typescript
import chalk from 'chalk';

export class CLIError extends Error {
    constructor(
        message: string,
        public readonly suggestion?: string,
        public readonly exitCode: number = 1
    ) {
        super(message);
        this.name = 'CLIError';
    }
}

export class ErrorHandler {
    /**
     * Handle errors gracefully with user-friendly messages
     */
    static handle(error: unknown): never {
        const isDebug = process.env.DEBUG === '1' || process.env.DEBUG === 'true';

        if (error instanceof CLIError) {
            // User-facing error with suggestion
            console.error(chalk.red(`✗ Error: ${error.message}`));
            if (error.suggestion) {
                console.error(chalk.yellow(`  ${error.suggestion}`));
            }
            if (isDebug) {
                console.error(chalk.gray(`\nStack trace:\n${error.stack}`));
            }
            process.exit(error.exitCode);
        } else if (error instanceof Error) {
            // Unexpected error
            console.error(chalk.red(`✗ Unexpected error: ${error.message}`));
            
            if (isDebug) {
                console.error(chalk.gray(`\nStack trace:\n${error.stack}`));
            } else {
                console.error(
                    chalk.yellow(`\nFor more details, run with: DEBUG=1 npx intent-guard <command>`)
                );
            }
            
            process.exit(1);
        } else {
            // Unknown error type
            console.error(chalk.red(`✗ Unknown error occurred`));
            console.error(error);
            process.exit(1);
        }
    }

    /**
     * Wrap async function with error handling
     */
    static async wrap<T>(fn: () => Promise<T>): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            this.handle(error);
        }
    }
}
```

---

### 2. Update CLI Entry Point

**File**: `src/cli/index.ts`

Wrap the entire CLI in error handler:

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION } from '../index';
import { InitCommand } from './commands/init-command';
import { ValidateCommand } from './commands/validate-command';
import { RulesForCommand } from './commands/rules-for-command';
import { ErrorHandler } from './error-handler';

const program = new Command();

program
    .name('intent-guard')
    .description('Deterministic architectural controller for AI-generated code')
    .version(VERSION);

// Init command
program
    .command('init')
    .description('Initialize Intent-Guard in the current project')
    .action(async () => {
        await ErrorHandler.wrap(async () => {
            const cmd = new InitCommand();
            await cmd.execute();
        });
    });

// Validate command
program
    .command('validate')
    .description('Validate codebase against architectural rules')
    .option('-f, --format <format>', 'Output format (json|text)', 'text')
    .option('-d, --diff', 'Validate only changed files (git diff)', false)
    .action(async (options) => {
        await ErrorHandler.wrap(async () => {
            const cmd = new ValidateCommand();
            await cmd.execute(options);
        });
    });

// Rules-for command
program
    .command('rules-for <file>')
    .description('Get architectural rules for a specific file (JITC support)')
    .action(async (file) => {
        await ErrorHandler.wrap(async () => {
            const cmd = new RulesForCommand();
            await cmd.execute(file);
        });
    });

// Global error handler for uncaught errors
process.on('uncaughtException', (error) => {
    ErrorHandler.handle(error);
});

process.on('unhandledRejection', (reason) => {
    ErrorHandler.handle(reason);
});

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
```

---

### 3. Update Commands to Throw CLIError

**File**: `src/cli/commands/base-command.ts`

```typescript
import { ConfigLoader } from '../../config';
import { IntentGuardConfig } from '../../types';
import { CLIError } from '../error-handler';

export abstract class BaseCommand {
    protected config: IntentGuardConfig | null = null;
    protected projectRoot: string | null = null;

    protected loadConfig(): void {
        try {
            this.config = ConfigLoader.load();
            this.projectRoot = ConfigLoader.findProjectRoot();
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw new CLIError(
                    'Configuration file not found',
                    "Run 'npx intent-guard init' to create configuration"
                );
            }
            throw error;
        }
    }
}
```

**File**: `src/cli/commands/validate-command.ts`

```typescript
import { CLIError } from '../error-handler';
import { GitUtils } from '../../utils/git';

async execute(options: ValidateOptions = {}): Promise<void> {
    // ... existing code ...

    if (options.diff) {
        if (!GitUtils.isGitRepository(this.projectRoot)) {
            throw new CLIError(
                '--diff mode requires a git repository',
                "Initialize git with: git init"
            );
        }

        try {
            changedFiles = GitUtils.getChangedFiles(this.projectRoot);
        } catch (error) {
            throw new CLIError(
                'Failed to get changed files from git',
                'Ensure git is installed and working directory is clean'
            );
        }
    }

    // ... rest of code ...
}
```

---

## Implementation Steps

### Step 1: Create Error Handler

1. Create `src/cli/error-handler.ts`
2. Implement `CLIError` class
3. Implement `ErrorHandler` class with `handle` and `wrap` methods

### Step 2: Update CLI Entry Point

1. Import `ErrorHandler` in `src/cli/index.ts`
2. Wrap all command actions with `ErrorHandler.wrap`
3. Add global uncaught exception handlers

### Step 3: Update Commands

1. Update `BaseCommand` to throw `CLIError` for config not found
2. Update `ValidateCommand` to throw `CLIError` for git errors
3. Update other commands as needed

### Step 4: Add Tests

**File**: `tests/unit/cli/error-handler.test.ts` (NEW)

```typescript
import { CLIError, ErrorHandler } from '../../../src/cli/error-handler';

describe('CLIError', () => {
    it('should create error with message and suggestion', () => {
        const error = new CLIError('Test error', 'Try this');
        expect(error.message).toBe('Test error');
        expect(error.suggestion).toBe('Try this');
        expect(error.exitCode).toBe(1);
    });

    it('should allow custom exit code', () => {
        const error = new CLIError('Test', 'Suggestion', 2);
        expect(error.exitCode).toBe(2);
    });
});

describe('ErrorHandler', () => {
    let exitSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        exitSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('should handle CLIError gracefully', () => {
        const error = new CLIError('Test error', 'Try this');
        ErrorHandler.handle(error);

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle generic Error', () => {
        const error = new Error('Generic error');
        ErrorHandler.handle(error);

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});
```

---

## Validation Steps

### 1. Build Project

```bash
npm run build
```

### 2. Test Error Handling Manually

```bash
# Test config not found error
cd /tmp
npx intent-guard validate
# Should show: "Configuration file not found" with suggestion

# Test --diff in non-git directory
mkdir test-no-git && cd test-no-git
npx intent-guard validate --diff
# Should show: "requires a git repository" with suggestion

# Test with DEBUG mode
DEBUG=1 npx intent-guard validate
# Should show stack trace
```

### 3. Run Tests

```bash
npm test -- tests/unit/cli/error-handler.test.ts
```

### 4. Test All Commands

```bash
# Each should fail gracefully with helpful messages
npx intent-guard validate  # No config
npx intent-guard rules-for nonexistent.ts  # File not found
npx intent-guard validate --diff  # No git
```

---

## Success Criteria

- ✅ `CLIError` class implemented
- ✅ `ErrorHandler` with `handle` and `wrap` methods
- ✅ All CLI commands wrapped with error handler
- ✅ User-friendly error messages (no stack traces by default)
- ✅ DEBUG mode shows stack traces
- ✅ Suggestions provided for common errors
- ✅ Tests pass
- ✅ No uncaught exceptions crash the CLI

---

## Common Error Messages to Handle

1. **Config not found**: Suggest `npx intent-guard init`
2. **Git not available**: Suggest installing git or removing `--diff`
3. **Invalid YAML**: Show parsing error with line number
4. **File not found**: Show which file and suggest checking path
5. **Permission denied**: Suggest checking file permissions

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
