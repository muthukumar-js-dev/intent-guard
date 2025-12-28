# Phase 3 - Task 3: Implement `validate` Command

## Task Overview
**Phase**: 3 - CLI Development  
**Task**: 3 of 5  
**Estimated Time**: 3-4 hours  
**Complexity**: Medium-High

---

## Objective
Create the main `validate` command that runs all validators and outputs results.

---

## Requirements

Create `src/cli/commands/validate-command.ts` - See full implementation in original combined file (lines 172-269).

Key features:
- Load config and build dependency graph
- Run all validators (layer boundary, protected regions, banned dependencies)
- Aggregate results
- Support JSON and human-readable output formats
- Exit with code 1 if errors found

Register command in `src/cli/index.ts`:
```typescript
program
  .command('validate')
  .description('Validate codebase against architectural rules')
  .option('-f, --format <format>', 'Output format (json|text)', 'text')
  .option('-d, --diff', 'Validate only changed files (git diff)', false)
  .action(async (options) => {
    const cmd = new ValidateCommand();
    await cmd.execute(options);
  });
```

---

## Success Criteria

- ✅ `npx intent-guard validate` runs all validators
- ✅ `npx intent-guard validate --format json` outputs JSON
- ✅ Shows colored output for violations
- ✅ Exit code 0 for success, 1 for errors
- ✅ All unit tests pass

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
