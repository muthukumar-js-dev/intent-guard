# Phase 2 - Task 3: Protected Regions Validator

## Task Overview
**Phase**: 2 - Core Validation Engine  
**Task**: 3 of 4  
**Estimated Time**: 3-4 hours  
**Complexity**: Medium

---

## Objective
Implement validator that prevents modifications to protected code regions marked as `aiMutable: false`.

---

## Requirements

### 1. Protected Regions Validator

Create `src/core/validators/protected-regions-validator.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { IntentGuardConfig, ValidationResult, Violation } from '../../types';

export class ProtectedRegionsValidator {
  private config: IntentGuardConfig;
  private projectRoot: string;

  constructor(config: IntentGuardConfig, projectRoot: string) {
    this.config = config;
    this.projectRoot = projectRoot;
  }

  /**
   * Validate that protected regions have not been modified
   * @param changedFiles - List of files that have been modified (optional)
   */
  async validate(changedFiles?: string[]): Promise<ValidationResult> {
    const violations: Violation[] = [];

    if (!this.config.protectedRegions || this.config.protectedRegions.length === 0) {
      return {
        valid: true,
        violations: [],
        summary: { errors: 0, warnings: 0, filesAnalyzed: 0 }
      };
    }

    for (const region of this.config.protectedRegions) {
      if (region.aiMutable) continue; // Skip mutable regions

      const matchedFiles = await this.findMatchingFiles(region.path);

      for (const file of matchedFiles) {
        // If changedFiles is provided, only check changed files
        if (changedFiles && !changedFiles.includes(file)) continue;

        violations.push({
          ruleId: 'protected-region',
          severity: 'error',
          file,
          message: `Cannot modify protected region: ${region.reason}`,
          suggestion: 'This file requires manual review and approval',
          autoFixable: false
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      summary: {
        errors: violations.filter(v => v.severity === 'error').length,
        warnings: violations.filter(v => v.severity === 'warning').length,
        filesAnalyzed: changedFiles?.length ?? 0
      }
    };
  }

  private async findMatchingFiles(pattern: string): Promise<string[]> {
    const absolutePattern = path.join(this.projectRoot, pattern);
    return await glob(absolutePattern);
  }
}
```

---

## Success Criteria

- ✅ Detects modifications to protected regions
- ✅ Supports glob patterns for protected paths
- ✅ All unit tests pass

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
