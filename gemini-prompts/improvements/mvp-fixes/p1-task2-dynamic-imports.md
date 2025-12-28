# P1 Task 2: Add Dynamic Import Support

**Priority**: P1 (Important)  
**Estimated Time**: 3-4 hours  
**Complexity**: Medium-High

---

## Problem

Parsers don't detect:
- Dynamic imports: `import('./module')`
- CommonJS requires: `require('module')`

## Solution

### TypeScript Parser

Update `src/core/parsers/typescript-parser.ts`:

```typescript
private traverse(node: ts.Node, analysis: FileAnalysis): void {
    // Existing import detection...

    // NEW: Detect dynamic imports
    if (ts.isCallExpression(node)) {
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
            const arg = node.arguments[0];
            if (ts.isStringLiteral(arg)) {
                analysis.imports.push({
                    module: arg.text,
                    line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                    column: sourceFile.getLineAndCharacterOfPosition(node.getStart()).character,
                    isRelative: arg.text.startsWith('.'),
                    isDynamic: true,
                    importedNames: [],
                });
            }
        }
        
        // NEW: Detect require()
        if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
            const arg = node.arguments[0];
            if (ts.isStringLiteral(arg)) {
                analysis.imports.push({
                    module: arg.text,
                    line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                    column: sourceFile.getLineAndCharacterOfPosition(node.getStart()).character,
                    isRelative: arg.text.startsWith('.'),
                    isRequire: true,
                    importedNames: [],
                });
            }
        }
    }

    // Continue traversal...
}
```

### JavaScript Parser

Update `src/core/parsers/javascript-parser.ts` similarly using Babel AST.

### Update Types

Update `src/core/parsers/types.ts`:

```typescript
export interface ImportInfo {
    module: string;
    line: number;
    column: number;
    isRelative: boolean;
    isDynamic?: boolean;  // NEW
    isRequire?: boolean;  // NEW
    // ... existing fields
}
```

## Tests

Add tests in `tests/unit/core/parsers/parsers.test.ts`:

```typescript
it('should detect dynamic imports', () => {
    const code = `const mod = import('./module');`;
    const analysis = parser.parse('test.ts', code);
    expect(analysis.imports).toHaveLength(1);
    expect(analysis.imports[0].isDynamic).toBe(true);
});

it('should detect require calls', () => {
    const code = `const mod = require('./module');`;
    const analysis = parser.parse('test.ts', code);
    expect(analysis.imports).toHaveLength(1);
    expect(analysis.imports[0].isRequire).toBe(true);
});
```

## Success Criteria

- ✅ Dynamic imports detected
- ✅ require() calls detected
- ✅ Tests pass
- ✅ Validators work with new import types
