# Phase 7 - Task 2: AI Feedback Loop with Auto-Fix

## Task Overview
**Phase**: 7 - AI Integration & MCP Support  
**Task**: 2 of 5  
**Estimated Time**: 1 week  
**Complexity**: High

---

## Objective
Implement an AI feedback loop that automatically suggests fixes for violations and can optionally auto-apply them.

---

## Requirements

Create `src/ai/feedback-generator.ts` that:
- Takes validation violations
- Generates AI-friendly fix prompts
- Optionally calls AI to generate fixes
- Validates fixes before applying

Key features:
- Template-based fix suggestions
- Context-aware prompts
- Validation of AI-generated fixes
- Safe auto-apply with rollback

---

## Success Criteria

- ✅ Generates helpful fix prompts
- ✅ AI fix success rate >70%
- ✅ No breaking changes from auto-fixes
- ✅ Rollback works correctly

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
