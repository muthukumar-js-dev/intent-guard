# Phase 6 - Task 3: Explain Command for Intent Details

## Task Overview
**Phase**: 6 - Semantic Intelligence  
**Task**: 3 of 4  
**Estimated Time**: 2-3 days  
**Complexity**: Medium

---

## Objective
Implement the `explain` command that provides detailed information about a specific intent, including its purpose, dependencies, and usage examples.

---

## Context
After building the intent registry, developers need a way to understand existing intents before deciding whether to reuse or create new ones. The `explain` command provides comprehensive documentation for each registered intent.

---

## Requirements

### 1. Intent Explainer

Create `src/cli/commands/explain-command.ts`:

```typescript
import chalk from 'chalk';
import { BaseCommand } from './base-command';
import { IntentRegistry } from '../../core/semantic/intent-registry';
import * as fs from 'fs';
import * as path from 'path';

export class ExplainCommand extends BaseCommand {
  async execute(intentId: string): Promise<void> {
    this.loadConfig();

    if (!this.config || !this.projectRoot) {
      console.error(chalk.red('❌ Configuration not found'));
      process.exit(1);
    }

    // Load intent registry
    const registryPath = path.join(this.projectRoot, '.intentguard', 'memory.json');
    if (!fs.existsSync(registryPath)) {
      console.error(chalk.red('❌ Intent registry not found. Run: npx intent-guard sync'));
      process.exit(1);
    }

    const memory = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    const registry = new IntentRegistry();
    registry.fromJSON(memory.intentRegistry || []);

    // Find intent
    const intent = this.findIntent(registry, intentId);
    
    if (!intent) {
      console.error(chalk.red(`❌ Intent "${intentId}" not found`));
      console.log(chalk.gray('\nAvailable intents:'));
      this.listAvailableIntents(registry);
      process.exit(1);
    }

    // Display intent details
    this.displayIntentDetails(intent);
  }

  private findIntent(registry: IntentRegistry, intentId: string) {
    const intents = registry.toJSON();
    return intents.find(i => i.id === intentId || i.functionName === intentId);
  }

  private displayIntentDetails(intent: any): void {
    console.log(chalk.blue.bold(`\n📋 Intent: ${intent.id}\n`));

    // Description
    console.log(chalk.white.bold('Description:'));
    console.log(`  ${intent.description}\n`);

    // Location
    console.log(chalk.white.bold('Location:'));
    console.log(`  ${chalk.cyan(intent.location)}\n`);

    // Function name
    console.log(chalk.white.bold('Function:'));
    console.log(`  ${chalk.green(intent.functionName)}\n`);

    // Semantic hash
    console.log(chalk.white.bold('Semantic Hash:'));
    console.log(`  ${intent.semanticHash}\n`);

    // Created date
    console.log(chalk.white.bold('Created:'));
    console.log(`  ${new Date(intent.createdAt).toLocaleString()}\n`);

    // Mutability
    console.log(chalk.white.bold('AI Mutable:'));
    const mutableStatus = intent.mutable !== false ? 
      chalk.green('✓ Yes') : 
      chalk.red('✗ No (Protected)');
    console.log(`  ${mutableStatus}\n`);

    // Dependencies (if available)
    if (intent.dependencies && intent.dependencies.length > 0) {
      console.log(chalk.white.bold('Dependencies:'));
      intent.dependencies.forEach((dep: string) => {
        console.log(`  - ${chalk.cyan(dep)}`);
      });
      console.log();
    }

    // Usage example
    console.log(chalk.white.bold('Usage:'));
    console.log(chalk.gray('  To reuse this intent, import it from:'));
    console.log(`  ${chalk.cyan(`import { ${intent.functionName} } from '${this.getImportPath(intent.location)}'`)}\n`);

    // Similar intents (if any)
    this.displaySimilarIntents(intent);
  }

  private getImportPath(location: string): string {
    // Convert file path to import path
    // e.g., src/auth/utils.ts:validateUserPermissions -> ./auth/utils
    const filePath = location.split(':')[0];
    return filePath.replace(/^src\//, './').replace(/\.ts$/, '');
  }

  private displaySimilarIntents(intent: any): void {
    // This would query the registry for similar intents
    // For now, just show a placeholder
    console.log(chalk.white.bold('Similar Intents:'));
    console.log(chalk.gray('  (Run semantic analysis to find similar intents)\n'));
  }

  private listAvailableIntents(registry: IntentRegistry): void {
    const intents = registry.toJSON();
    intents.forEach(intent => {
      console.log(`  - ${chalk.cyan(intent.id)} (${intent.functionName})`);
    });
  }
}
```

### 2. Register Command

Add to `src/cli/index.ts`:

```typescript
import { ExplainCommand } from './commands/explain-command';

program
  .command('explain <intent-id>')
  .description('Explain a specific intent in detail')
  .action(async (intentId) => {
    const cmd = new ExplainCommand();
    await cmd.execute(intentId);
  });
```

### 3. Enhanced Output with Code Snippet

Optionally, read the actual function code and display it:

```typescript
private async displayCodeSnippet(intent: any): Promise<void> {
  const [filePath, functionName] = intent.location.split(':');
  const fullPath = path.join(this.projectRoot!, filePath);

  if (!fs.existsSync(fullPath)) {
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const parser = ParserFactory.getParser(fullPath);
  
  if (!parser) return;

  const analysis = parser.parse(fullPath);
  const func = analysis.functions.find(f => f.name === functionName);

  if (func && func.startLine && func.endLine) {
    const lines = content.split('\n');
    const snippet = lines.slice(func.startLine - 1, func.endLine).join('\n');

    console.log(chalk.white.bold('Code:'));
    console.log(chalk.gray('```typescript'));
    console.log(snippet);
    console.log(chalk.gray('```\n'));
  }
}
```

---

## CLI Usage Examples

### Example 1: Explain an Intent

```bash
$ npx intent-guard explain validate-user-permissions

📋 Intent: validate-user-permissions

Description:
  Validates user permissions against role-based access control

Location:
  src/auth/utils.ts:validateUserPermissions

Function:
  validateUserPermissions

Semantic Hash:
  abc123def456

Created:
  12/20/2025, 3:30:00 PM

AI Mutable:
  ✗ No (Protected)

Dependencies:
  - src/domain/user.ts
  - src/domain/role.ts

Usage:
  To reuse this intent, import it from:
  import { validateUserPermissions } from './auth/utils'

Code:
```typescript
function validateUserPermissions(user: User, resource: Resource) {
  if (!user.roles.includes('admin')) {
    throw new Error('Unauthorized');
  }
}
```

Similar Intents:
  - check-user-access (92% similar)
  - verify-permissions (87% similar)
```

### Example 2: Intent Not Found

```bash
$ npx intent-guard explain non-existent-intent

❌ Intent "non-existent-intent" not found

Available intents:
  - validate-user-permissions (validateUserPermissions)
  - process-payment (processPayment)
  - send-notification (sendNotification)
```

---

## Implementation Steps

1. Create `ExplainCommand` class
2. Implement intent lookup logic
3. Add formatted output display
4. Optionally add code snippet extraction
5. Register command in CLI
6. Write unit tests
7. Update documentation

---

## Unit Tests

Create `tests/unit/cli/explain-command.test.ts`:

```typescript
describe('ExplainCommand', () => {
  it('should display intent details', async () => {
    // Test with valid intent ID
  });

  it('should show error for non-existent intent', async () => {
    // Test with invalid intent ID
  });

  it('should list available intents on error', async () => {
    // Test that available intents are shown
  });

  it('should display code snippet if available', async () => {
    // Test code snippet extraction
  });
});
```

---

## Success Criteria

- ✅ `npx intent-guard explain <id>` shows intent details
- ✅ Displays description, location, hash, mutability
- ✅ Shows usage example with import statement
- ✅ Lists similar intents (if available)
- ✅ Optionally displays code snippet
- ✅ Shows helpful error for non-existent intents
- ✅ Lists available intents on error
- ✅ All unit tests pass

---

## Output Format Options

Support JSON output for programmatic use:

```bash
$ npx intent-guard explain validate-user-permissions --format json

{
  "id": "validate-user-permissions",
  "description": "Validates user permissions against role-based access control",
  "location": "src/auth/utils.ts:validateUserPermissions",
  "functionName": "validateUserPermissions",
  "semanticHash": "abc123def456",
  "createdAt": "2025-12-20T15:30:00Z",
  "mutable": false,
  "dependencies": ["src/domain/user.ts", "src/domain/role.ts"],
  "similarIntents": [
    { "id": "check-user-access", "similarity": 0.92 }
  ]
}
```

---

## Next Steps

After completing this task:
1. Test with various intent IDs
2. Integrate with semantic similarity search
3. Add to documentation
4. Proceed to **Phase 6 - Task 4**: Graph Visualization Command

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
