# P1 Task 1: Implement cannotImportFrom

**Priority**: P1 (Important)  
**Estimated Time**: 2 hours  
**Complexity**: Medium

---

## Problem

The schema defines `cannotImportFrom` but the `LayerBoundaryValidator` doesn't enforce it.

## Solution

Update `src/core/validators/layer-boundary-validator.ts`:

```typescript
validate(): ValidationResult {
    const violations: Violation[] = [];

    for (const edge of this.graph.edges) {
        const fromNode = this.graph.nodes.find((n) => n.id === edge.from);
        const toNode = this.graph.nodes.find((n) => n.id === edge.to);

        if (!fromNode || !toNode || !fromNode.layer || !toNode.layer) continue;

        const fromLayer = this.config.architecture.layers.find((l) => l.name === fromNode.layer);
        if (!fromLayer) continue;

        // Check canImportFrom (existing logic)
        if (!fromLayer.canImportFrom.includes(toNode.layer)) {
            violations.push({...});
        }

        // NEW: Check cannotImportFrom
        if (fromLayer.cannotImportFrom?.includes(toNode.layer)) {
            violations.push({
                ruleId: 'layer-boundary-forbidden',
                severity: 'error',
                file: fromNode.filePath,
                line: edge.importLine,
                message: `Layer "${fromLayer.name}" explicitly cannot import from "${toNode.layer}"`,
                suggestion: `Remove this import or refactor to use ${fromLayer.canImportFrom.join(' or ')}`,
                autoFixable: false,
            });
        }
    }

    return {...};
}
```

## Tests

Add test case in `tests/unit/core/validators/layer-boundary-validator.test.ts`:

```typescript
it('should detect cannotImportFrom violations', () => {
    const config = {
        architecture: {
            layers: [
                { name: 'domain', path: 'src/domain/**', canImportFrom: [], cannotImportFrom: ['infrastructure'] },
                { name: 'infrastructure', path: 'src/infra/**', canImportFrom: ['domain'] }
            ]
        }
    };
    // Test that domain importing infrastructure creates violation
});
```

## Success Criteria

- ✅ `cannotImportFrom` enforced in validator
- ✅ Tests pass
- ✅ Documentation updated in `docs/configuration.md`
