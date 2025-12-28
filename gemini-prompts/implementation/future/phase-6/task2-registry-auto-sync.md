# Phase 6 - Task 2: Intent Registry Auto-Sync

## Task Overview
**Phase**: 6 - Semantic Intelligence  
**Task**: 2 of 4  
**Estimated Time**: 4-5 days  
**Complexity**: Medium-High

---

## Objective
Automatically build and maintain the intent registry by scanning the codebase and extracting function intents.

---

## Requirements

Create `src/core/semantic/registry-builder.ts` that:
- Scans entire codebase
- Extracts all functions
- Generates semantic hashes
- Builds intent registry
- Saves to `.intentguard/memory.json`

Key features:
- Incremental updates (only scan changed files)
- Parallel processing for performance
- Progress reporting
- Error recovery

---

## Success Criteria

- ✅ Can scan 1000+ files in <30 seconds
- ✅ Incremental updates work correctly
- ✅ Registry persists to disk
- ✅ CLI command `npx intent-guard sync` works

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
