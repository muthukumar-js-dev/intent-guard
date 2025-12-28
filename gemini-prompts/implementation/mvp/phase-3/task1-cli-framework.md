# Phase 3 - Task 1: CLI Framework and Command Structure

## Task Overview
**Phase**: 3 - CLI Development  
**Task**: 1 of 5  
**Estimated Time**: 2-3 hours  
**Complexity**: Medium

---

## Objective
Set up the CLI framework using Commander.js with proper command structure, help text, and error handling.

---

## Context
This is the foundation for all CLI commands. We're using Commander.js for command parsing and chalk for colored output. The base command class will provide common functionality like config loading.

---

## Requirements

### 1. Create Base Command Class

Create `src/cli/commands/base-command.ts`:

```typescript
import { Command } from 'commander';
import { ConfigLoader } from '../../config';
import { IntentGuardConfig } from '../../types';

export abstract class BaseCommand {
  protected config?: IntentGuardConfig;
  protected projectRoot?: string;

  protected loadConfig(): void {
    try {
      this.config = ConfigLoader.load();
      this.projectRoot = ConfigLoader.findProjectRoot() || process.cwd();
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  abstract execute(...args: any[]): Promise<void>;
}
```

### 2. Update CLI Entry Point

Update `src/cli/index.ts`:

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION } from '../index';

const program = new Command();

program
  .name('intent-guard')
  .description('Deterministic architectural controller for AI-generated code')
  .version(VERSION);

// Commands will be added in subsequent tasks

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
```

---

## Implementation Steps

1. Create `src/cli/commands/` directory
2. Create `base-command.ts` with abstract base class
3. Update `src/cli/index.ts` with Commander.js setup
4. Test CLI runs: `node dist/cli/index.js --version`

---

## Unit Tests

Create `tests/unit/cli/base-command.test.ts`:

```typescript
import { BaseCommand } from '../../../src/cli/commands/base-command';

class TestCommand extends BaseCommand {
  async execute(): Promise<void> {
    // Test implementation
  }
}

describe('BaseCommand', () => {
  it('should load config successfully', () => {
    const cmd = new TestCommand();
    expect(() => cmd['loadConfig']()).not.toThrow();
  });

  it('should exit on config load error', () => {
    // Test error handling
  });
});
```

---

## Success Criteria

- ✅ `src/cli/commands/base-command.ts` exists
- ✅ `src/cli/index.ts` uses Commander.js
- ✅ `node dist/cli/index.js --version` shows version
- ✅ `node dist/cli/index.js --help` shows help text
- ✅ Base command class can load config
- ✅ All unit tests pass

---

## Validation

```bash
# Build
npm run build

# Test version
node dist/cli/index.js --version

# Test help
node dist/cli/index.js --help

# Run tests
npm test tests/unit/cli/base-command.test.ts
```

---

## Common Pitfalls

1. **Shebang missing**: Ensure `#!/usr/bin/env node` is first line
2. **Commander.js version**: Use v11+ for latest features
3. **Error handling**: Always catch config load errors
4. **Exit codes**: Use `process.exit(1)` for errors

---

## Next Steps

After completing this task:
1. Verify CLI framework works
2. Proceed to **Phase 3 - Task 2**: Implement `init` Command
3. Update task.md to mark this task as complete

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
