# Phase 1 - Task 3: AST Parser Abstraction Layer

## Task Overview
**Phase**: 1 - Project Foundation & Core Infrastructure  
**Task**: 3 of 3  
**Estimated Time**: 5-6 hours  
**Complexity**: High

---

## Objective
Create a unified AST (Abstract Syntax Tree) parser abstraction that can analyze both TypeScript and JavaScript files, extracting imports, exports, functions, and other structural information needed for validation.

---

## Context
Intent-guard needs to analyze code structure to:
- Extract import statements (to build dependency graph)
- Identify function definitions (for future semantic analysis)
- Detect exports (to understand module boundaries)
- Support both TypeScript (.ts, .tsx) and JavaScript (.js, .jsx) files

The parser must be:
- **Fast**: Parse thousands of files quickly
- **Accurate**: Extract correct line/column information
- **Unified**: Same interface for TS and JS
- **Extensible**: Easy to add new extraction capabilities

---

## Requirements

### 1. Parser Interface Definition

Create `src/core/parsers/types.ts`:

```typescript
/**
 * Common types for AST parsers
 */

export interface ImportInfo {
  module: string;           // Module specifier (e.g., './utils', 'lodash')
  line: number;             // Line number (1-indexed)
  column: number;           // Column number (0-indexed)
  isRelative: boolean;      // true if starts with . or ..
  resolvedPath?: string;    // Absolute path (if resolvable)
  importedNames?: string[]; // Named imports (e.g., ['foo', 'bar'])
  isDefault?: boolean;      // true if default import
  isNamespace?: boolean;    // true if namespace import (import * as)
}

export interface ExportInfo {
  name: string;             // Export name
  line: number;
  column: number;
  isDefault: boolean;       // true if default export
  isReExport: boolean;      // true if re-exporting from another module
  fromModule?: string;      // Source module if re-export
}

export interface FunctionInfo {
  name: string;             // Function name (or '<anonymous>')
  line: number;
  column: number;
  endLine: number;
  body: string;             // Function body as string
  params: string[];         // Parameter names
  isAsync: boolean;
  isGenerator: boolean;
  isArrowFunction: boolean;
}

export interface ClassInfo {
  name: string;
  line: number;
  column: number;
  methods: FunctionInfo[];
  properties: string[];
}

export interface FileAnalysis {
  filePath: string;
  language: 'typescript' | 'javascript';
  imports: ImportInfo[];
  exports: ExportInfo[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  errors: ParseError[];
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

/**
 * Parser interface that all parsers must implement
 */
export interface IParser {
  /**
   * Parse a file and extract structural information
   * @param filePath - Absolute path to file
   * @param content - File content (optional, will read from disk if not provided)
   * @returns File analysis result
   */
  parse(filePath: string, content?: string): FileAnalysis;

  /**
   * Check if this parser supports the given file
   * @param filePath - File path to check
   * @returns true if parser can handle this file
   */
  supports(filePath: string): boolean;
}
```

### 2. TypeScript Parser Implementation

Create `src/core/parsers/typescript-parser.ts`:

```typescript
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import {
  IParser,
  FileAnalysis,
  ImportInfo,
  ExportInfo,
  FunctionInfo,
  ClassInfo,
  ParseError
} from './types';

export class TypeScriptParser implements IParser {
  private static readonly SUPPORTED_EXTENSIONS = ['.ts', '.tsx'];

  supports(filePath: string): boolean {
    const ext = path.extname(filePath);
    return TypeScriptParser.SUPPORTED_EXTENSIONS.includes(ext);
  }

  parse(filePath: string, content?: string): FileAnalysis {
    const sourceCode = content ?? fs.readFileSync(filePath, 'utf-8');
    
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true // setParentNodes
    );

    const analysis: FileAnalysis = {
      filePath,
      language: 'typescript',
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      errors: []
    };

    // Extract information by traversing AST
    this.traverse(sourceFile, analysis);

    return analysis;
  }

  private traverse(node: ts.Node, analysis: FileAnalysis): void {
    // Extract imports
    if (ts.isImportDeclaration(node)) {
      const importInfo = this.extractImport(node, analysis.filePath);
      if (importInfo) {
        analysis.imports.push(importInfo);
      }
    }

    // Extract exports
    if (this.isExportNode(node)) {
      const exportInfo = this.extractExport(node);
      if (exportInfo) {
        analysis.exports.push(exportInfo);
      }
    }

    // Extract functions
    if (this.isFunctionNode(node)) {
      const functionInfo = this.extractFunction(node);
      if (functionInfo) {
        analysis.functions.push(functionInfo);
      }
    }

    // Extract classes
    if (ts.isClassDeclaration(node)) {
      const classInfo = this.extractClass(node);
      if (classInfo) {
        analysis.classes.push(classInfo);
      }
    }

    // Recursively traverse children
    ts.forEachChild(node, (child) => this.traverse(child, analysis));
  }

  private extractImport(node: ts.ImportDeclaration, filePath: string): ImportInfo | null {
    const moduleSpecifier = node.moduleSpecifier;
    
    if (!ts.isStringLiteral(moduleSpecifier)) {
      return null;
    }

    const module = moduleSpecifier.text;
    const sourceFile = node.getSourceFile();
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

    const importInfo: ImportInfo = {
      module,
      line: line + 1, // Convert to 1-indexed
      column: character,
      isRelative: module.startsWith('.') || module.startsWith('..'),
      importedNames: []
    };

    // Extract imported names
    if (node.importClause) {
      const { name, namedBindings } = node.importClause;

      // Default import
      if (name) {
        importInfo.isDefault = true;
        importInfo.importedNames?.push(name.text);
      }

      // Named imports
      if (namedBindings) {
        if (ts.isNamedImports(namedBindings)) {
          importInfo.importedNames = namedBindings.elements.map(e => e.name.text);
        } else if (ts.isNamespaceImport(namedBindings)) {
          importInfo.isNamespace = true;
          importInfo.importedNames?.push(namedBindings.name.text);
        }
      }
    }

    // Resolve relative imports
    if (importInfo.isRelative) {
      const dir = path.dirname(filePath);
      importInfo.resolvedPath = path.resolve(dir, module);
    }

    return importInfo;
  }

  private extractExport(node: ts.Node): ExportInfo | null {
    const sourceFile = node.getSourceFile();
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

    // Export declaration (export { foo, bar })
    if (ts.isExportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      const fromModule = moduleSpecifier && ts.isStringLiteral(moduleSpecifier)
        ? moduleSpecifier.text
        : undefined;

      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        // Return first export (we'll handle multiple in traverse)
        const firstExport = node.exportClause.elements[0];
        if (firstExport) {
          return {
            name: firstExport.name.text,
            line: line + 1,
            column: character,
            isDefault: false,
            isReExport: !!fromModule,
            fromModule
          };
        }
      }
    }

    // Export assignment (export default foo)
    if (ts.isExportAssignment(node)) {
      return {
        name: 'default',
        line: line + 1,
        column: character,
        isDefault: true,
        isReExport: false
      };
    }

    // Named export (export function foo() {})
    if (this.hasExportModifier(node)) {
      const name = this.getNodeName(node);
      if (name) {
        return {
          name,
          line: line + 1,
          column: character,
          isDefault: this.hasDefaultModifier(node),
          isReExport: false
        };
      }
    }

    return null;
  }

  private extractFunction(node: ts.Node): FunctionInfo | null {
    const sourceFile = node.getSourceFile();
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;

    const name = this.getNodeName(node) || '<anonymous>';
    const body = node.getText(sourceFile);

    let params: string[] = [];
    let isAsync = false;
    let isGenerator = false;
    let isArrowFunction = false;

    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
      params = node.parameters.map(p => p.name.getText(sourceFile));
      isAsync = !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);
      isGenerator = !!node.asteriskToken;
    } else if (ts.isArrowFunction(node)) {
      params = node.parameters.map(p => p.name.getText(sourceFile));
      isAsync = !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);
      isArrowFunction = true;
    } else if (ts.isMethodDeclaration(node)) {
      params = node.parameters.map(p => p.name.getText(sourceFile));
      isAsync = !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);
    }

    return {
      name,
      line: line + 1,
      column: character,
      endLine,
      body,
      params,
      isAsync,
      isGenerator,
      isArrowFunction
    };
  }

  private extractClass(node: ts.ClassDeclaration): ClassInfo | null {
    const sourceFile = node.getSourceFile();
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

    const name = node.name?.text || '<anonymous>';
    const methods: FunctionInfo[] = [];
    const properties: string[] = [];

    for (const member of node.members) {
      if (ts.isMethodDeclaration(member)) {
        const method = this.extractFunction(member);
        if (method) {
          methods.push(method);
        }
      } else if (ts.isPropertyDeclaration(member)) {
        const propName = member.name.getText(sourceFile);
        properties.push(propName);
      }
    }

    return {
      name,
      line: line + 1,
      column: character,
      methods,
      properties
    };
  }

  private isFunctionNode(node: ts.Node): boolean {
    return (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    );
  }

  private isExportNode(node: ts.Node): boolean {
    return (
      ts.isExportDeclaration(node) ||
      ts.isExportAssignment(node) ||
      this.hasExportModifier(node)
    );
  }

  private hasExportModifier(node: ts.Node): boolean {
    if (!('modifiers' in node)) return false;
    const modifiers = (node as any).modifiers as ts.NodeArray<ts.Modifier> | undefined;
    return !!modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
  }

  private hasDefaultModifier(node: ts.Node): boolean {
    if (!('modifiers' in node)) return false;
    const modifiers = (node as any).modifiers as ts.NodeArray<ts.Modifier> | undefined;
    return !!modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
  }

  private getNodeName(node: ts.Node): string | null {
    if ('name' in node && node.name) {
      const name = node.name as ts.Identifier | ts.PropertyName;
      if (ts.isIdentifier(name)) {
        return name.text;
      }
    }
    return null;
  }
}
```

### 3. JavaScript Parser Implementation

Create `src/core/parsers/javascript-parser.ts`:

```typescript
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs';
import * as path from 'path';
import {
  IParser,
  FileAnalysis,
  ImportInfo,
  ExportInfo,
  FunctionInfo,
  ClassInfo
} from './types';

export class JavaScriptParser implements IParser {
  private static readonly SUPPORTED_EXTENSIONS = ['.js', '.jsx', '.mjs'];

  supports(filePath: string): boolean {
    const ext = path.extname(filePath);
    return JavaScriptParser.SUPPORTED_EXTENSIONS.includes(ext);
  }

  parse(filePath: string, content?: string): FileAnalysis {
    const sourceCode = content ?? fs.readFileSync(filePath, 'utf-8');

    const analysis: FileAnalysis = {
      filePath,
      language: 'javascript',
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      errors: []
    };

    try {
      const ast = parser.parse(sourceCode, {
        sourceType: 'module',
        plugins: ['jsx', 'dynamicImport']
      });

      traverse(ast, {
        // Extract imports
        ImportDeclaration: (path) => {
          const node = path.node;
          const importInfo: ImportInfo = {
            module: node.source.value,
            line: node.loc?.start.line ?? 0,
            column: node.loc?.start.column ?? 0,
            isRelative: node.source.value.startsWith('.') || node.source.value.startsWith('..'),
            importedNames: []
          };

          // Extract imported names
          for (const specifier of node.specifiers) {
            if (specifier.type === 'ImportDefaultSpecifier') {
              importInfo.isDefault = true;
              importInfo.importedNames?.push(specifier.local.name);
            } else if (specifier.type === 'ImportSpecifier') {
              importInfo.importedNames?.push(specifier.imported.name);
            } else if (specifier.type === 'ImportNamespaceSpecifier') {
              importInfo.isNamespace = true;
              importInfo.importedNames?.push(specifier.local.name);
            }
          }

          // Resolve relative imports
          if (importInfo.isRelative) {
            const dir = path.dirname(filePath);
            importInfo.resolvedPath = path.resolve(dir, importInfo.module);
          }

          analysis.imports.push(importInfo);
        },

        // Extract exports
        ExportNamedDeclaration: (path) => {
          const node = path.node;
          
          if (node.declaration) {
            // export function foo() {} or export const bar = ...
            const name = this.getDeclarationName(node.declaration);
            if (name) {
              analysis.exports.push({
                name,
                line: node.loc?.start.line ?? 0,
                column: node.loc?.start.column ?? 0,
                isDefault: false,
                isReExport: false
              });
            }
          } else if (node.specifiers) {
            // export { foo, bar }
            for (const specifier of node.specifiers) {
              analysis.exports.push({
                name: specifier.exported.name,
                line: node.loc?.start.line ?? 0,
                column: node.loc?.start.column ?? 0,
                isDefault: false,
                isReExport: !!node.source,
                fromModule: node.source?.value
              });
            }
          }
        },

        ExportDefaultDeclaration: (path) => {
          const node = path.node;
          analysis.exports.push({
            name: 'default',
            line: node.loc?.start.line ?? 0,
            column: node.loc?.start.column ?? 0,
            isDefault: true,
            isReExport: false
          });
        },

        // Extract functions
        FunctionDeclaration: (path) => {
          const node = path.node;
          analysis.functions.push({
            name: node.id?.name ?? '<anonymous>',
            line: node.loc?.start.line ?? 0,
            column: node.loc?.start.column ?? 0,
            endLine: node.loc?.end.line ?? 0,
            body: sourceCode.substring(node.start ?? 0, node.end ?? 0),
            params: node.params.map(p => (p as any).name ?? ''),
            isAsync: node.async,
            isGenerator: node.generator,
            isArrowFunction: false
          });
        },

        // Extract classes
        ClassDeclaration: (path) => {
          const node = path.node;
          const classInfo: ClassInfo = {
            name: node.id?.name ?? '<anonymous>',
            line: node.loc?.start.line ?? 0,
            column: node.loc?.start.column ?? 0,
            methods: [],
            properties: []
          };

          for (const member of node.body.body) {
            if (member.type === 'ClassMethod') {
              classInfo.methods.push({
                name: (member.key as any).name ?? '',
                line: member.loc?.start.line ?? 0,
                column: member.loc?.start.column ?? 0,
                endLine: member.loc?.end.line ?? 0,
                body: sourceCode.substring(member.start ?? 0, member.end ?? 0),
                params: member.params.map(p => (p as any).name ?? ''),
                isAsync: member.async,
                isGenerator: member.generator,
                isArrowFunction: false
              });
            } else if (member.type === 'ClassProperty') {
              classInfo.properties.push((member.key as any).name ?? '');
            }
          }

          analysis.classes.push(classInfo);
        }
      });
    } catch (error: any) {
      analysis.errors.push({
        message: error.message,
        line: error.loc?.line ?? 0,
        column: error.loc?.column ?? 0
      });
    }

    return analysis;
  }

  private getDeclarationName(declaration: any): string | null {
    if (declaration.id && declaration.id.name) {
      return declaration.id.name;
    }
    if (declaration.declarations && declaration.declarations[0]) {
      return declaration.declarations[0].id.name;
    }
    return null;
  }
}
```

### 4. Parser Factory

Create `src/core/parsers/parser-factory.ts`:

```typescript
import { IParser } from './types';
import { TypeScriptParser } from './typescript-parser';
import { JavaScriptParser } from './javascript-parser';

export class ParserFactory {
  private static parsers: IParser[] = [
    new TypeScriptParser(),
    new JavaScriptParser()
  ];

  /**
   * Get appropriate parser for a file
   * @param filePath - File path to parse
   * @returns Parser instance or null if no parser supports the file
   */
  static getParser(filePath: string): IParser | null {
    for (const parser of this.parsers) {
      if (parser.supports(filePath)) {
        return parser;
      }
    }
    return null;
  }

  /**
   * Check if a file is supported
   * @param filePath - File path to check
   * @returns true if any parser supports this file
   */
  static isSupported(filePath: string): boolean {
    return this.getParser(filePath) !== null;
  }
}
```

### 5. Export from parsers module

Create `src/core/parsers/index.ts`:

```typescript
export * from './types';
export { TypeScriptParser } from './typescript-parser';
export { JavaScriptParser } from './javascript-parser';
export { ParserFactory } from './parser-factory';
```

---

## Implementation Steps

1. **Install Babel parser** (for JavaScript):
   ```bash
   npm install @babel/parser @babel/traverse
   npm install -D @types/babel__traverse
   ```

2. **Create parser types** (`src/core/parsers/types.ts`)

3. **Implement TypeScript parser** (`src/core/parsers/typescript-parser.ts`)

4. **Implement JavaScript parser** (`src/core/parsers/javascript-parser.ts`)

5. **Create parser factory** (`src/core/parsers/parser-factory.ts`)

6. **Write unit tests** (`tests/unit/core/parsers/`)

---

## Unit Tests Required

Create test files in `tests/unit/core/parsers/`:

```typescript
// typescript-parser.test.ts
describe('TypeScriptParser', () => {
  it('should extract imports from TS file', () => {});
  it('should extract exports from TS file', () => {});
  it('should extract functions from TS file', () => {});
  it('should extract classes from TS file', () => {});
  it('should handle relative imports', () => {});
  it('should handle namespace imports', () => {});
});

// javascript-parser.test.ts
describe('JavaScriptParser', () => {
  it('should extract imports from JS file', () => {});
  it('should extract exports from JS file', () => {});
  it('should extract functions from JS file', () => {});
  it('should extract classes from JS file', () => {});
});

// parser-factory.test.ts
describe('ParserFactory', () => {
  it('should return TypeScript parser for .ts files', () => {});
  it('should return JavaScript parser for .js files', () => {});
  it('should return null for unsupported files', () => {});
});
```

Create test fixtures in `tests/fixtures/parsers/`:
- `sample.ts` - TypeScript file with imports, exports, functions
- `sample.js` - JavaScript file with imports, exports, functions
- `sample.tsx` - React TypeScript component
- `sample.jsx` - React JavaScript component

---

## Success Criteria

- ✅ Can parse TypeScript files and extract imports
- ✅ Can parse JavaScript files and extract imports
- ✅ Correctly identifies relative vs absolute imports
- ✅ Extracts function definitions with line numbers
- ✅ Extracts class definitions with methods
- ✅ Handles both default and named imports/exports
- ✅ Parser factory returns correct parser for file type
- ✅ All unit tests pass
- ✅ Code coverage >90% for parsers module

---

## Validation

```bash
# Build should succeed
npm run build

# Tests should pass
npm test tests/unit/core/parsers/

# Try parsing a file
node -e "
const { ParserFactory } = require('./dist/core/parsers');
const parser = ParserFactory.getParser('test.ts');
const result = parser.parse('test.ts', 'import { foo } from \"./bar\";');
console.log(JSON.stringify(result, null, 2));
"
```

---

## Common Pitfalls

1. **Line numbering**: TypeScript uses 0-indexed, convert to 1-indexed
2. **Babel types**: Use type guards to check node types
3. **Relative paths**: Resolve relative imports to absolute paths
4. **Error handling**: Catch parse errors and add to errors array
5. **Performance**: Don't parse file content multiple times

---

## Next Steps

After completing this task:
1. Verify all Phase 1 tests pass
2. Proceed to **Phase 2 - Task 1**: Dependency Graph Builder
3. Update task.md to mark Phase 1 as complete

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
