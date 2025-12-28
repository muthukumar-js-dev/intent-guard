# Phase 3 - Task 2: Implement `init` Command

## Task Overview
**Phase**: 3 - CLI Development  
**Task**: 2 of 5  
**Estimated Time**: 2-3 hours  
**Complexity**: Medium

---

## Objective
Create the `init` command that generates initial configuration files for a new project.

---

## Context
The `init` command is the entry point for new users. It should create a `.intentguard/` directory with a default `intent.config.yaml` file that demonstrates the package's capabilities.

---

## Requirements

### 1. Create Init Command

Create `src/cli/commands/init-command.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { BaseCommand } from './base-command';

export class InitCommand extends BaseCommand {
  async execute(): Promise<void> {
    const configDir = path.join(process.cwd(), '.intentguard');
    const configFile = path.join(configDir, 'intent.config.yaml');

    // Check if config already exists
    if (fs.existsSync(configFile)) {
      console.log(chalk.yellow('⚠️  Configuration already exists at .intentguard/intent.config.yaml'));
      console.log(chalk.yellow('   Delete it first if you want to reinitialize.'));
      return;
    }

    // Create .intentguard directory
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Create default config
    const defaultConfig = `version: "1.0.0"

architecture:
  layers:
    - name: presentation
      path: src/presentation/**
      canImportFrom: [domain, infrastructure]
    
    - name: domain
      path: src/domain/**
      canImportFrom: []
    
    - name: infrastructure
      path: src/infrastructure/**
      canImportFrom: [domain]

# Optional: Define protected regions
protectedRegions: []

# Optional: Define banned dependencies
bannedDependencies: []
`;

    fs.writeFileSync(configFile, defaultConfig);

    // Create .gitignore entry for memory.json
    const gitignorePath = path.join(configDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'memory.json\n');

    console.log(chalk.green('✨ Intent-Guard initialized!\n'));
    console.log('Created:');
    console.log(chalk.cyan('  .intentguard/'));
    console.log(chalk.cyan('    intent.config.yaml') + '  (architecture contracts)');
    console.log(chalk.cyan('    .gitignore') + '          (excludes memory.json)\n');
    console.log('Next steps:');
    console.log('  1. Edit .intentguard/intent.config.yaml to define your architecture');
    console.log('  2. Run: ' + chalk.cyan('npx intent-guard validate'));
    console.log('  3. Add to package.json scripts:');
    console.log(chalk.gray('     "validate:intent": "intent-guard validate"'));
  }
}
```

### 2. Register Command

Add to `src/cli/index.ts`:

```typescript
import { InitCommand } from './commands/init-command';

program
  .command('init')
  .description('Initialize Intent-Guard in the current project')
  .action(async () => {
    const cmd = new InitCommand();
    await cmd.execute();
  });
```

### 3. Export Command

Create/update `src/cli/commands/index.ts`:

```typescript
export { BaseCommand } from './base-command';
export { InitCommand } from './init-command';
```

---

## Implementation Steps

1. Create `src/cli/commands/init-command.ts`
2. Implement config file generation
3. Add command to CLI index
4. Test init command
5. Write unit tests

---

## Unit Tests

Create `tests/unit/cli/init-command.test.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { InitCommand } from '../../../src/cli/commands/init-command';

describe('InitCommand', () => {
  const testDir = path.join(__dirname, 'test-init');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('should create config directory and files', async () => {
    process.chdir(testDir);
    const cmd = new InitCommand();
    await cmd.execute();

    const configPath = path.join(testDir, '.intentguard', 'intent.config.yaml');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('should not overwrite existing config', async () => {
    process.chdir(testDir);
    const cmd = new InitCommand();
    
    await cmd.execute();
    const firstRun = fs.readFileSync(
      path.join(testDir, '.intentguard', 'intent.config.yaml'),
      'utf-8'
    );

    await cmd.execute();
    const secondRun = fs.readFileSync(
      path.join(testDir, '.intentguard', 'intent.config.yaml'),
      'utf-8'
    );

    expect(firstRun).toBe(secondRun);
  });

  it('should create .gitignore file', async () => {
    process.chdir(testDir);
    const cmd = new InitCommand();
    await cmd.execute();

    const gitignorePath = path.join(testDir, '.intentguard', '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);
    expect(fs.readFileSync(gitignorePath, 'utf-8')).toContain('memory.json');
  });
});
```

---

## Success Criteria

- ✅ `npx intent-guard init` creates `.intentguard/` directory
- ✅ Creates `intent.config.yaml` with default config
- ✅ Creates `.gitignore` file
- ✅ Shows helpful success message
- ✅ Prevents overwriting existing config
- ✅ All unit tests pass

---

## Validation

```bash
# Build
npm run build

# Test in empty directory
cd /tmp/test-project
npx intent-guard init

# Verify files created
ls -la .intentguard/

# Try running again (should warn)
npx intent-guard init

# Run tests
npm test tests/unit/cli/init-command.test.ts
```

---

## Common Pitfalls

1. **Path resolution**: Use `process.cwd()` not `__dirname`
2. **File permissions**: Ensure directory is writable
3. **YAML formatting**: Maintain proper indentation
4. **Overwrite protection**: Check file exists before writing

---

## Next Steps

After completing this task:
1. Test init command manually
2. Proceed to **Phase 3 - Task 3**: Implement `validate` Command
3. Update task.md to mark this task as complete

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
