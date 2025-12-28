# Phase 2 - Task 4: Banned Dependencies Checker

## Task Overview
**Phase**: 2 - Core Validation Engine  
**Task**: 4 of 4  
**Estimated Time**: 3-4 hours  
**Complexity**: Medium

---

## Objective
Implement validator that detects usage of banned packages and import patterns.

---

## Requirements

### 1. Banned Dependencies Checker

Create `src/core/validators/banned-dependencies-validator.ts`:

```typescript
import { IntentGuardConfig, ValidationResult, Violation, DependencyGraph } from '../../types';
import { ParserFactory } from '../parsers';

export class BannedDependenciesValidator {
  private config: IntentGuardConfig;
  private graph: DependencyGraph;

  constructor(config: IntentGuardConfig, graph: DependencyGraph) {
    this.config = config;
    this.graph = graph;
  }

  async validate(): Promise<ValidationResult> {
    const violations: Violation[] = [];

    if (!this.config.bannedDependencies || this.config.bannedDependencies.length === 0) {
      return {
        valid: true,
        violations: [],
        summary: { errors: 0, warnings: 0, filesAnalyzed: 0 }
      };
    }

    for (const node of this.graph.nodes) {
      const parser = ParserFactory.getParser(node.filePath);
      if (!parser) continue;

      const analysis = parser.parse(node.filePath);

      for (const importInfo of analysis.imports) {
        for (const banned of this.config.bannedDependencies) {
          // Check banned package
          if (banned.package && importInfo.module === banned.package) {
            violations.push({
              ruleId: 'banned-dependency',
              severity: 'error',
              file: node.filePath,
              line: importInfo.line,
              message: `Banned dependency: ${banned.package} - ${banned.reason}`,
              suggestion: banned.alternatives
                ? `Use ${banned.alternatives.join(' or ')} instead`
                : 'Remove this dependency',
              autoFixable: false
            });
          }

          // Check banned pattern (e.g., "src/presentation/** -> src/infrastructure/**")
          if (banned.pattern) {
            const [fromPattern, toPattern] = banned.pattern.split('->').map(s => s.trim());
            
            if (this.matchesPattern(node.filePath, fromPattern) &&
                importInfo.resolvedPath &&
                this.matchesPattern(importInfo.resolvedPath, toPattern)) {
              violations.push({
                ruleId: 'banned-dependency-pattern',
                severity: 'error',
                file: node.filePath,
                line: importInfo.line,
                message: `Banned import pattern: ${banned.reason}`,
                suggestion: banned.alternatives
                  ? `Use ${banned.alternatives.join(' or ')} instead`
                  : 'Refactor to avoid this dependency',
                autoFixable: false
              });
            }
          }
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      summary: {
        errors: violations.filter(v => v.severity === 'error').length,
        warnings: violations.filter(v => v.severity === 'warning').length,
        filesAnalyzed: this.graph.nodes.length
      }
    };
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$'
    );
    return regex.test(filePath);
  }
}
```

### 2. Export all validators

Create `src/core/validators/index.ts`:

```typescript
export { LayerBoundaryValidator } from './layer-boundary-validator';
export { ProtectedRegionsValidator } from './protected-regions-validator';
export { BannedDependenciesValidator } from './banned-dependencies-validator';
```

---

## Success Criteria

- ✅ Detects banned package imports
- ✅ Detects banned import patterns
- ✅ Provides alternative suggestions
- ✅ All unit tests pass

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
