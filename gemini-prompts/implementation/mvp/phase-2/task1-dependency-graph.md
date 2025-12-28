# Phase 2 - Task 1: Dependency Graph Builder

## Task Overview
**Phase**: 2 - Core Validation Engine  
**Task**: 1 of 4  
**Estimated Time**: 4-5 hours  
**Complexity**: High

---

## Objective
Build a dependency graph that maps all import/export relationships across the codebase. This graph is the foundation for layer boundary validation and architectural analysis.

---

## Context
The dependency graph:
- Maps which files import which other files
- Assigns each file to an architectural layer
- Enables detection of layer boundary violations
- Supports future drift detection and visualization

---

## Requirements

### 1. Graph Builder Implementation

Create `src/core/graph/dependency-graph-builder.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { ParserFactory } from '../parsers';
import { IntentGuardConfig, LayerDefinition } from '../../types';
import {
  DependencyGraph,
  GraphNode,
  GraphEdge
} from '../../types';

export class DependencyGraphBuilder {
  private config: IntentGuardConfig;
  private projectRoot: string;

  constructor(config: IntentGuardConfig, projectRoot: string) {
    this.config = config;
    this.projectRoot = projectRoot;
  }

  /**
   * Build dependency graph for the entire project
   * @returns Complete dependency graph
   */
  async build(): Promise<DependencyGraph> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const fileToNode = new Map<string, GraphNode>();

    // Find all files matching layer patterns
    const allFiles = await this.findAllFiles();

    // Create nodes for each file
    for (const filePath of allFiles) {
      const layer = this.getFileLayer(filePath);
      const node: GraphNode = {
        id: this.normalizeFilePath(filePath),
        filePath,
        layer: layer?.name
      };
      nodes.push(node);
      fileToNode.set(filePath, node);
    }

    // Parse each file and create edges
    for (const filePath of allFiles) {
      const parser = ParserFactory.getParser(filePath);
      if (!parser) continue;

      try {
        const analysis = parser.parse(filePath);
        
        for (const importInfo of analysis.imports) {
          const resolvedPath = this.resolveImport(filePath, importInfo.module);
          
          if (resolvedPath && fileToNode.has(resolvedPath)) {
            edges.push({
              from: this.normalizeFilePath(filePath),
              to: this.normalizeFilePath(resolvedPath),
              importLine: importInfo.line
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to parse ${filePath}:`, error);
      }
    }

    return { nodes, edges };
  }

  /**
   * Find all files matching layer patterns
   */
  private async findAllFiles(): Promise<string[]> {
    const patterns = this.config.architecture.layers.map(l => l.path);
    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const absolutePattern = path.join(this.projectRoot, pattern);
      const files = await glob(absolutePattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.spec.ts']
      });
      allFiles.push(...files);
    }

    // Remove duplicates
    return Array.from(new Set(allFiles));
  }

  /**
   * Get the layer a file belongs to
   */
  private getFileLayer(filePath: string): LayerDefinition | null {
    const relativePath = path.relative(this.projectRoot, filePath);
    
    for (const layer of this.config.architecture.layers) {
      const pattern = layer.path.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
      const regex = new RegExp(`^${pattern}$`);
      
      if (regex.test(relativePath)) {
        return layer;
      }
    }

    return null;
  }

  /**
   * Resolve import to absolute file path
   */
  private resolveImport(fromFile: string, importModule: string): string | null {
    // Handle relative imports
    if (importModule.startsWith('.')) {
      const dir = path.dirname(fromFile);
      let resolved = path.resolve(dir, importModule);

      // Try with different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
          return withExt;
        }
        
        // Try index files
        const indexPath = path.join(resolved, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }

    // Handle absolute imports (node_modules, etc.) - ignore for now
    return null;
  }

  /**
   * Normalize file path for consistent comparison
   */
  private normalizeFilePath(filePath: string): string {
    return path.relative(this.projectRoot, filePath).replace(/\\/g, '/');
  }
}
```

### 2. Export from graph module

Create `src/core/graph/index.ts`:

```typescript
export { DependencyGraphBuilder } from './dependency-graph-builder';
```

---

## Implementation Steps

1. Create `src/core/graph/dependency-graph-builder.ts`
2. Implement file discovery using glob patterns
3. Implement layer assignment logic
4. Implement import resolution
5. Build graph nodes and edges
6. Write unit tests

---

## Unit Tests

Create `tests/unit/core/graph/dependency-graph-builder.test.ts`:

```typescript
describe('DependencyGraphBuilder', () => {
  it('should build graph for simple project', async () => {});
  it('should assign files to correct layers', async () => {});
  it('should resolve relative imports', async () => {});
  it('should create edges for imports', async () => {});
  it('should handle missing files gracefully', async () => {});
});
```

---

## Success Criteria

- ✅ Can build dependency graph for test project
- ✅ Correctly assigns files to layers
- ✅ Resolves relative imports to absolute paths
- ✅ Creates edges for all import relationships
- ✅ Handles parse errors gracefully
- ✅ All unit tests pass

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
