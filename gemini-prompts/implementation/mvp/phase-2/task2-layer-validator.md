# Phase 2 - Task 2: Layer Boundary Validator

## Task Overview
**Phase**: 2 - Core Validation Engine  
**Task**: 2 of 4  
**Estimated Time**: 3-4 hours  
**Complexity**: Medium

---

## Objective
Implement the core validator that enforces layer boundary rules defined in the configuration. This is the primary validation rule for architectural integrity.

---

## Requirements

### 1. Layer Boundary Validator

Create `src/core/validators/layer-boundary-validator.ts`:

```typescript
import { IntentGuardConfig, ValidationResult, Violation, DependencyGraph } from '../../types';

export class LayerBoundaryValidator {
  private config: IntentGuardConfig;
  private graph: DependencyGraph;

  constructor(config: IntentGuardConfig, graph: DependencyGraph) {
    this.config = config;
    this.graph = graph;
  }

  validate(): ValidationResult {
    const violations: Violation[] = [];

    for (const edge of this.graph.edges) {
      const fromNode = this.graph.nodes.find(n => n.id === edge.from);
      const toNode = this.graph.nodes.find(n => n.id === edge.to);

      if (!fromNode || !toNode) continue;
      if (!fromNode.layer || !toNode.layer) continue;

      const fromLayer = this.config.architecture.layers.find(l => l.name === fromNode.layer);
      if (!fromLayer) continue;

      // Check if import is allowed
      if (!fromLayer.canImportFrom.includes(toNode.layer)) {
        violations.push({
          ruleId: 'layer-boundary',
          severity: 'error',
          file: fromNode.filePath,
          line: edge.importLine,
          message: `Layer "${fromLayer.name}" cannot import from layer "${toNode.layer}"`,
          suggestion: `Move this logic to ${fromLayer.canImportFrom.join(' or ')} layer`,
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
        filesAnalyzed: this.graph.nodes.length
      }
    };
  }
}
```

---

## Success Criteria

- ✅ Detects layer boundary violations
- ✅ Provides actionable error messages
- ✅ All unit tests pass

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
