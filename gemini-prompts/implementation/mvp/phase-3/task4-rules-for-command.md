# Phase 3 - Task 4: Implement `rules-for` Command

## Task Overview
**Phase**: 3 - CLI Development  
**Task**: 4 of 5  
**Estimated Time**: 2-3 hours  
**Complexity**: Medium

---

## Objective
Create the `rules-for` command for just-in-time context delivery to AI IDEs.

---

## Requirements

Create `src/cli/commands/rules-for-command.ts` - See full implementation in original combined file (lines 297-356).

Key features:
- Accept file path as argument
- Find which layer the file belongs to
- Check if file is in protected region
- Output JSON with layer rules and constraints

Register command in `src/cli/index.ts`:
```typescript
program
  .command('rules-for <file>')
  .description('Get architectural rules for a specific file (JITC support)')
  .action(async (file) => {
    const cmd = new RulesForCommand();
    await cmd.execute(file);
  });
```

---

## Success Criteria

- ✅ `npx intent-guard rules-for <path>` returns JSON
- ✅ Shows layer name and import rules
- ✅ Shows protected region status
- ✅ Handles files not in any layer
- ✅ All unit tests pass

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
