# Phase 6 - Task 1: AST-Based Intent Hashing

## Task Overview
**Phase**: 6 - Semantic Intelligence  
**Task**: 1 of 4  
**Estimated Time**: 1 week  
**Complexity**: High

---

## Objective
Implement AST-based function hashing to detect semantic duplicates without relying on embeddings or external AI models.

---

## Context
After MVP, we need to detect when AI generates logically identical functions with different syntax. This task implements a deterministic approach using AST normalization and hashing.

**Example Problem**:
```typescript
// Function 1
function validateUser(user) {
  if (!user.roles.includes('admin')) {
    throw new Error('Unauthorized');
  }
}

// Function 2 (semantically identical, different syntax)
function checkAccess(currentUser) {
  const hasPermission = currentUser.roles.some(r => r === 'admin');
  if (!hasPermission) return false;
}
```

Both should hash to the same semantic signature.

---

## Requirements

### 1. AST Normalization

Create `src/core/semantic/ast-normalizer.ts`:

```typescript
import * as ts from 'typescript';

export interface NormalizedAST {
  structure: string;
  operations: string[];
  controlFlow: string[];
}

export class ASTNormalizer {
  /**
   * Normalize a function's AST by removing variable names,
   * preserving only structure and logic
   */
  normalize(functionNode: ts.FunctionDeclaration): NormalizedAST {
    const structure = this.extractStructure(functionNode);
    const operations = this.extractOperations(functionNode);
    const controlFlow = this.extractControlFlow(functionNode);

    return { structure, operations, controlFlow };
  }

  private extractStructure(node: ts.Node): string {
    // Extract function structure (if/else, loops, returns)
    const parts: string[] = [];
    
    ts.forEachChild(node, (child) => {
      if (ts.isIfStatement(child)) {
        parts.push('IF');
      } else if (ts.isReturnStatement(child)) {
        parts.push('RETURN');
      } else if (ts.isThrowStatement(child)) {
        parts.push('THROW');
      }
      // Recursively process children
      parts.push(this.extractStructure(child));
    });

    return parts.join('|');
  }

  private extractOperations(node: ts.Node): string[] {
    // Extract operations (method calls, operators)
    const operations: string[] = [];
    
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n)) {
        const expr = n.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          operations.push(expr.name.text); // e.g., "includes", "some"
        }
      } else if (ts.isBinaryExpression(n)) {
        operations.push(ts.tokenToString(n.operatorToken.kind)!);
      }
      
      ts.forEachChild(n, visit);
    };

    visit(node);
    return operations;
  }

  private extractControlFlow(node: ts.Node): string[] {
    // Extract control flow patterns
    const flow: string[] = [];
    
    const visit = (n: ts.Node) => {
      if (ts.isIfStatement(n)) {
        flow.push('IF');
        if (n.elseStatement) flow.push('ELSE');
      } else if (ts.isForStatement(n) || ts.isWhileStatement(n)) {
        flow.push('LOOP');
      } else if (ts.isReturnStatement(n)) {
        flow.push('RETURN');
      } else if (ts.isThrowStatement(n)) {
        flow.push('THROW');
      }
      
      ts.forEachChild(n, visit);
    };

    visit(node);
    return flow;
  }
}
```

### 2. Intent Hasher

Create `src/core/semantic/intent-hasher.ts`:

```typescript
import * as crypto from 'crypto';
import { NormalizedAST, ASTNormalizer } from './ast-normalizer';

export class IntentHasher {
  private normalizer: ASTNormalizer;

  constructor() {
    this.normalizer = new ASTNormalizer();
  }

  /**
   * Generate a semantic hash for a function
   */
  hash(functionNode: ts.FunctionDeclaration): string {
    const normalized = this.normalizer.normalize(functionNode);
    
    // Create a deterministic string representation
    const representation = [
      normalized.structure,
      normalized.operations.sort().join(','),
      normalized.controlFlow.join(',')
    ].join('::');

    // Hash it
    return crypto
      .createHash('sha256')
      .update(representation)
      .digest('hex')
      .substring(0, 16); // Use first 16 chars
  }

  /**
   * Compare two function hashes for similarity
   */
  similarity(hash1: string, hash2: string): number {
    if (hash1 === hash2) return 1.0;
    
    // Hamming distance for partial similarity
    let matches = 0;
    for (let i = 0; i < Math.min(hash1.length, hash2.length); i++) {
      if (hash1[i] === hash2[i]) matches++;
    }
    
    return matches / Math.max(hash1.length, hash2.length);
  }
}
```

### 3. Intent Registry

Create `src/core/semantic/intent-registry.ts`:

```typescript
import { IntentDefinition } from '../../types';

export interface IntentRecord {
  id: string;
  description: string;
  location: string;
  semanticHash: string;
  functionName: string;
  createdAt: Date;
}

export class IntentRegistry {
  private intents: Map<string, IntentRecord>;

  constructor() {
    this.intents = new Map();
  }

  /**
   * Register a new intent
   */
  register(intent: IntentRecord): void {
    this.intents.set(intent.id, intent);
  }

  /**
   * Find intents with similar semantic hashes
   */
  findSimilar(semanticHash: string, threshold: number = 0.9): IntentRecord[] {
    const similar: IntentRecord[] = [];
    
    for (const intent of this.intents.values()) {
      const similarity = this.calculateSimilarity(semanticHash, intent.semanticHash);
      if (similarity >= threshold) {
        similar.push(intent);
      }
    }

    return similar;
  }

  /**
   * Check if an intent already exists
   */
  exists(semanticHash: string): boolean {
    for (const intent of this.intents.values()) {
      if (intent.semanticHash === semanticHash) {
        return true;
      }
    }
    return false;
  }

  private calculateSimilarity(hash1: string, hash2: string): number {
    if (hash1 === hash2) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < Math.min(hash1.length, hash2.length); i++) {
      if (hash1[i] === hash2[i]) matches++;
    }
    
    return matches / Math.max(hash1.length, hash2.length);
  }

  /**
   * Serialize registry to JSON
   */
  toJSON(): IntentRecord[] {
    return Array.from(this.intents.values());
  }

  /**
   * Load registry from JSON
   */
  fromJSON(data: IntentRecord[]): void {
    this.intents.clear();
    for (const record of data) {
      this.intents.set(record.id, record);
    }
  }
}
```

### 4. Semantic Duplicate Validator

Create `src/core/validators/semantic-duplicate-validator.ts`:

```typescript
import { ValidationResult, Violation } from '../../types';
import { IntentHasher } from '../semantic/intent-hasher';
import { IntentRegistry } from '../semantic/intent-registry';
import { ParserFactory } from '../parsers';

export class SemanticDuplicateValidator {
  private hasher: IntentHasher;
  private registry: IntentRegistry;

  constructor(registry: IntentRegistry) {
    this.hasher = new IntentHasher();
    this.registry = registry;
  }

  async validate(filePath: string): Promise<ValidationResult> {
    const violations: Violation[] = [];
    
    const parser = ParserFactory.getParser(filePath);
    if (!parser) {
      return { valid: true, violations: [], summary: { errors: 0, warnings: 0, filesAnalyzed: 0 } };
    }

    const analysis = parser.parse(filePath);

    for (const func of analysis.functions) {
      // Generate semantic hash
      const hash = this.hasher.hash(func as any);

      // Check for similar intents
      const similar = this.registry.findSimilar(hash, 0.9);

      if (similar.length > 0) {
        violations.push({
          ruleId: 'semantic-duplicate',
          severity: 'warning',
          file: filePath,
          line: func.line,
          message: `Function "${func.name}" is semantically similar to existing intent "${similar[0].id}"`,
          suggestion: `Consider reusing ${similar[0].location} instead of duplicating logic`,
          autoFixable: false
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      summary: {
        errors: 0,
        warnings: violations.length,
        filesAnalyzed: 1
      }
    };
  }
}
```

---

## Implementation Steps

1. Create AST normalizer
2. Implement intent hasher
3. Build intent registry
4. Create semantic duplicate validator
5. Integrate with validate command
6. Write comprehensive tests
7. Update documentation

---

## Unit Tests

Create `tests/unit/core/semantic/intent-hasher.test.ts`:

```typescript
describe('IntentHasher', () => {
  it('should generate same hash for semantically identical functions', () => {
    // Test with two different syntaxes, same logic
  });

  it('should generate different hashes for different logic', () => {
    // Test with different logic
  });

  it('should calculate similarity correctly', () => {
    // Test similarity calculation
  });
});
```

---

## Success Criteria

- ✅ AST normalizer removes variable names
- ✅ Intent hasher generates deterministic hashes
- ✅ Registry can find similar intents
- ✅ Validator detects semantic duplicates
- ✅ >90% accuracy on test cases
- ✅ <100ms per function analysis
- ✅ All unit tests pass

---

## Performance Requirements

- Hash generation: <10ms per function
- Similarity search: <50ms for 1000 intents
- Memory usage: <100MB for 10k intents

---

## Next Steps

After completing this task:
1. Proceed to **Phase 6 - Task 2**: Embedding-Based Similarity (Optional)
2. Update intent.config.yaml schema to support intent definitions
3. Update CLI to show semantic duplicate warnings

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
