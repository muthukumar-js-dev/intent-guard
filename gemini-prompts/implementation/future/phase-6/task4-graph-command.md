# Phase 6 - Task 4: Graph Visualization Command

## Task Overview
**Phase**: 6 - Semantic Intelligence  
**Task**: 4 of 4  
**Estimated Time**: 3-4 days  
**Complexity**: Medium-High

---

## Objective
Implement the `graph` command that visualizes the dependency graph and architectural layers in the terminal or exports to various formats.

---

## Context
Understanding the dependency structure is crucial for maintaining clean architecture. The `graph` command provides visual representation of how modules depend on each other and which layers they belong to.

---

## Requirements

### 1. Graph Visualizer

Create `src/cli/commands/graph-command.ts`:

```typescript
import chalk from 'chalk';
import { BaseCommand } from './base-command';
import { DependencyGraphBuilder } from '../../core/graph';
import * as fs from 'fs';
import * as path from 'path';

export interface GraphOptions {
  format?: 'ascii' | 'dot' | 'json' | 'mermaid';
  output?: string;
  filter?: string;
  showLayers?: boolean;
}

export class GraphCommand extends BaseCommand {
  async execute(options: GraphOptions = {}): Promise<void> {
    this.loadConfig();

    if (!this.config || !this.projectRoot) {
      console.error(chalk.red('❌ Configuration not found'));
      process.exit(1);
    }

    console.log(chalk.blue('🔍 Building dependency graph...\n'));

    // Build graph
    const builder = new DependencyGraphBuilder(this.config, this.projectRoot);
    const graph = await builder.build();

    console.log(chalk.gray(`   Analyzed ${graph.nodes.length} files\n`));

    // Apply filter if specified
    const filteredGraph = options.filter 
      ? this.filterGraph(graph, options.filter)
      : graph;

    // Generate visualization based on format
    const format = options.format || 'ascii';
    let output: string;

    switch (format) {
      case 'ascii':
        output = this.generateASCII(filteredGraph, options.showLayers);
        break;
      case 'dot':
        output = this.generateDOT(filteredGraph);
        break;
      case 'json':
        output = JSON.stringify(filteredGraph, null, 2);
        break;
      case 'mermaid':
        output = this.generateMermaid(filteredGraph);
        break;
      default:
        output = this.generateASCII(filteredGraph, options.showLayers);
    }

    // Output to file or console
    if (options.output) {
      fs.writeFileSync(options.output, output);
      console.log(chalk.green(`✅ Graph exported to ${options.output}`));
    } else {
      console.log(output);
    }
  }

  private filterGraph(graph: DependencyGraph, filter: string): DependencyGraph {
    // Filter nodes by pattern
    const pattern = new RegExp(filter);
    const filteredNodes = graph.nodes.filter(n => pattern.test(n.filePath));
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    
    const filteredEdges = graph.edges.filter(e => 
      nodeIds.has(e.from) && nodeIds.has(e.to)
    );

    return {
      nodes: filteredNodes,
      edges: filteredEdges
    };
  }

  private generateASCII(graph: DependencyGraph, showLayers: boolean = true): string {
    const lines: string[] = [];

    if (showLayers) {
      // Group by layer
      const layerGroups = this.groupByLayer(graph);

      lines.push(chalk.blue.bold('📊 Dependency Graph by Layer\n'));

      for (const [layer, nodes] of Object.entries(layerGroups)) {
        lines.push(chalk.yellow(`\n${layer.toUpperCase()} Layer:`));
        lines.push(chalk.gray('─'.repeat(50)));

        for (const node of nodes) {
          const deps = graph.edges
            .filter(e => e.from === node.id)
            .map(e => graph.nodes.find(n => n.id === e.to)?.filePath || e.to);

          lines.push(`\n  ${chalk.cyan(node.filePath)}`);
          
          if (deps.length > 0) {
            lines.push(chalk.gray('    Imports:'));
            deps.forEach(dep => {
              const depNode = graph.nodes.find(n => n.filePath === dep);
              const depLayer = depNode?.layer || 'unknown';
              const arrow = depLayer === layer ? '→' : '⇒';
              lines.push(`      ${arrow} ${chalk.white(dep)} ${chalk.gray(`(${depLayer})`)}`);
            });
          }
        }
      }
    } else {
      // Simple list
      lines.push(chalk.blue.bold('📊 Dependency Graph\n'));

      for (const node of graph.nodes) {
        const deps = graph.edges
          .filter(e => e.from === node.id)
          .map(e => graph.nodes.find(n => n.id === e.to)?.filePath || e.to);

        lines.push(`${chalk.cyan(node.filePath)}`);
        
        if (deps.length > 0) {
          deps.forEach(dep => {
            lines.push(`  → ${chalk.white(dep)}`);
          });
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private generateDOT(graph: DependencyGraph): string {
    const lines: string[] = [];

    lines.push('digraph DependencyGraph {');
    lines.push('  rankdir=LR;');
    lines.push('  node [shape=box, style=rounded];');
    lines.push('');

    // Group by layer for coloring
    const layerGroups = this.groupByLayer(graph);
    const layerColors: Record<string, string> = {
      'presentation': '#FFE5E5',
      'domain': '#E5F5FF',
      'infrastructure': '#E5FFE5',
      'unknown': '#F0F0F0'
    };

    // Add nodes with layer-based colors
    for (const [layer, nodes] of Object.entries(layerGroups)) {
      const color = layerColors[layer] || layerColors['unknown'];
      
      lines.push(`  // ${layer} layer`);
      for (const node of nodes) {
        const nodeId = this.sanitizeDOTId(node.id);
        const label = node.filePath.split('/').pop() || node.filePath;
        lines.push(`  ${nodeId} [label="${label}", fillcolor="${color}", style=filled];`);
      }
      lines.push('');
    }

    // Add edges
    lines.push('  // Dependencies');
    for (const edge of graph.edges) {
      const fromId = this.sanitizeDOTId(edge.from);
      const toId = this.sanitizeDOTId(edge.to);
      lines.push(`  ${fromId} -> ${toId};`);
    }

    lines.push('}');

    return lines.join('\n');
  }

  private generateMermaid(graph: DependencyGraph): string {
    const lines: string[] = [];

    lines.push('graph LR');
    lines.push('');

    // Group by layer
    const layerGroups = this.groupByLayer(graph);

    for (const [layer, nodes] of Object.entries(layerGroups)) {
      lines.push(`  subgraph ${layer}`);
      
      for (const node of nodes) {
        const nodeId = this.sanitizeMermaidId(node.id);
        const label = node.filePath.split('/').pop() || node.filePath;
        lines.push(`    ${nodeId}["${label}"]`);
      }
      
      lines.push('  end');
      lines.push('');
    }

    // Add edges
    for (const edge of graph.edges) {
      const fromId = this.sanitizeMermaidId(edge.from);
      const toId = this.sanitizeMermaidId(edge.to);
      lines.push(`  ${fromId} --> ${toId}`);
    }

    return lines.join('\n');
  }

  private groupByLayer(graph: DependencyGraph): Record<string, typeof graph.nodes> {
    const groups: Record<string, typeof graph.nodes> = {};

    for (const node of graph.nodes) {
      const layer = node.layer || 'unknown';
      if (!groups[layer]) {
        groups[layer] = [];
      }
      groups[layer].push(node);
    }

    return groups;
  }

  private sanitizeDOTId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private sanitizeMermaidId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}
```

### 2. Register Command

Add to `src/cli/index.ts`:

```typescript
import { GraphCommand } from './commands/graph-command';

program
  .command('graph')
  .description('Visualize dependency graph')
  .option('-f, --format <format>', 'Output format (ascii|dot|json|mermaid)', 'ascii')
  .option('-o, --output <file>', 'Output file path')
  .option('--filter <pattern>', 'Filter files by regex pattern')
  .option('--show-layers', 'Group by architectural layers', true)
  .action(async (options) => {
    const cmd = new GraphCommand();
    await cmd.execute(options);
  });
```

---

## CLI Usage Examples

### Example 1: ASCII Output (Default)

```bash
$ npx intent-guard graph

🔍 Building dependency graph...
   Analyzed 15 files

📊 Dependency Graph by Layer

PRESENTATION Layer:
──────────────────────────────────────────────────

  src/presentation/UserController.ts
    Imports:
      ⇒ src/domain/user.ts (domain)
      ⇒ src/infrastructure/database.ts (infrastructure)

  src/presentation/ProductController.ts
    Imports:
      ⇒ src/domain/product.ts (domain)

DOMAIN Layer:
──────────────────────────────────────────────────

  src/domain/user.ts
    (No dependencies)

  src/domain/product.ts
    (No dependencies)

INFRASTRUCTURE Layer:
──────────────────────────────────────────────────

  src/infrastructure/database.ts
    Imports:
      ⇒ src/domain/user.ts (domain)
```

### Example 2: Export to DOT Format

```bash
$ npx intent-guard graph --format dot --output graph.dot

🔍 Building dependency graph...
   Analyzed 15 files

✅ Graph exported to graph.dot

# Then visualize with Graphviz:
$ dot -Tpng graph.dot -o graph.png
```

### Example 3: Export to Mermaid

```bash
$ npx intent-guard graph --format mermaid --output graph.mmd

# Use in Markdown:
# ```mermaid
# (paste contents of graph.mmd)
# ```
```

### Example 4: Filter by Pattern

```bash
$ npx intent-guard graph --filter "src/domain/**"

# Shows only domain layer files
```

---

## Implementation Steps

1. Create `GraphCommand` class
2. Implement ASCII visualization
3. Implement DOT format export
4. Implement Mermaid format export
5. Add filtering capabilities
6. Register command in CLI
7. Write unit tests
8. Update documentation

---

## Success Criteria

- ✅ `npx intent-guard graph` shows ASCII visualization
- ✅ Supports DOT format export
- ✅ Supports Mermaid format export
- ✅ Supports JSON export
- ✅ Can filter by file pattern
- ✅ Groups by architectural layers
- ✅ Shows cross-layer dependencies clearly
- ✅ All unit tests pass

---

## Integration with Dashboard

This command can be integrated with the Phase 8 analytics dashboard:

```typescript
// In dashboard, fetch graph data
const graphData = await exec('npx intent-guard graph --format json');
// Render with D3.js or similar
```

---

## Next Steps

After completing this task:
1. Test with various project sizes
2. Optimize for large graphs (>1000 nodes)
3. Add interactive mode (future)
4. Proceed to **Phase 7**: AI Integration

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
