# Phase 1 - Task 1: Project Structure and Configuration Setup

## Task Overview
**Phase**: 1 - Project Foundation & Core Infrastructure  
**Task**: 1 of 3  
**Estimated Time**: 4-6 hours  
**Complexity**: Medium

---

## Objective
Set up the complete project structure for intent-guard, including TypeScript configuration, build system, package.json, and directory organization that will support all MVP features.

---

## Context
This is the foundation task for the entire intent-guard npm package. You are building a deterministic architectural controller that validates AI-generated code. The project must be:
- Written in TypeScript for type safety
- Publishable as an npm package
- Executable via CLI (`npx intent-guard`)
- Framework-agnostic (works with any JS/TS project)
- Zero external runtime dependencies (dev dependencies are fine)

---

## Requirements

### 1. Directory Structure
Create the following directory structure:

```
intent-guard/
├── src/
│   ├── cli/              # CLI commands and interface
│   ├── core/             # Core validation engine
│   │   ├── validators/   # Individual validator implementations
│   │   ├── parsers/      # AST parsers
│   │   └── graph/        # Dependency graph builder
│   ├── config/           # Configuration loader and schema
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── fixtures/         # Test fixtures and sample projects
├── examples/             # Example projects for testing
├── docs/                 # Documentation
├── .intentguard/         # Example config for self-validation
│   └── intent.config.yaml
├── package.json
├── tsconfig.json
├── tsconfig.build.json   # Separate config for building
├── .gitignore
├── .npmignore
├── LICENSE
└── README.md
```

### 2. package.json Configuration

**Required Fields**:
```json
{
  "name": "intent-guard",
  "version": "0.1.0",
  "description": "Deterministic architectural controller for AI-generated code validation",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "intent-guard": "dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "ai",
    "architecture",
    "validation",
    "linter",
    "guardrails",
    "intent",
    "static-analysis"
  ],
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0"
  }
}
```

**Required Dev Dependencies**:
- `typescript` (^5.0.0)
- `@types/node` (^20.0.0)
- `jest` (^29.0.0)
- `@types/jest` (^29.0.0)
- `ts-jest` (^29.0.0)
- `eslint` (^8.0.0)
- `@typescript-eslint/parser` (^6.0.0)
- `@typescript-eslint/eslint-plugin` (^6.0.0)
- `prettier` (^3.0.0)

**Required Runtime Dependencies** (minimal):
- `commander` (for CLI) - ^11.0.0
- `yaml` (for config parsing) - ^2.3.0
- `chalk` (for colored output) - ^5.3.0
- `glob` (for file pattern matching) - ^10.0.0

### 3. TypeScript Configuration

**tsconfig.json** (for development):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "types": ["node", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**tsconfig.build.json** (for production build):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": false,
    "declarationMap": false
  },
  "exclude": ["node_modules", "dist", "tests", "**/*.test.ts", "**/*.spec.ts"]
}
```

### 4. Jest Configuration

Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### 5. ESLint Configuration

Create `.eslintrc.js`:
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
};
```

### 6. Prettier Configuration

Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 7. .gitignore

```
node_modules/
dist/
coverage/
*.log
.DS_Store
.env
.vscode/
.idea/
*.tsbuildinfo
.intentguard/memory.json
```

### 8. .npmignore

```
src/
tests/
examples/
docs/
.github/
*.test.ts
*.spec.ts
tsconfig.json
tsconfig.build.json
jest.config.js
.eslintrc.js
.prettierrc
.gitignore
coverage/
```

### 9. LICENSE

Create MIT License file (standard MIT license text).

### 10. Initial Type Definitions

Create `src/types/index.ts`:

```typescript
/**
 * Core type definitions for intent-guard
 */

// Configuration Types
export interface IntentGuardConfig {
  version: string;
  architecture: ArchitectureConfig;
  intents?: IntentDefinition[];
  protectedRegions?: ProtectedRegion[];
  bannedDependencies?: BannedDependency[];
}

export interface ArchitectureConfig {
  layers: LayerDefinition[];
}

export interface LayerDefinition {
  name: string;
  path: string;
  canImportFrom: string[];
  cannotImportFrom?: string[];
}

export interface IntentDefinition {
  id: string;
  description: string;
  location: string;
  mutable: boolean;
  semanticHash?: string;
}

export interface ProtectedRegion {
  path: string;
  reason: string;
  aiMutable: boolean;
}

export interface BannedDependency {
  package?: string;
  pattern?: string;
  reason: string;
  alternatives?: string[];
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  violations: Violation[];
  summary: ValidationSummary;
}

export interface Violation {
  ruleId: string;
  severity: 'error' | 'warning';
  file: string;
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
}

export interface ValidationSummary {
  errors: number;
  warnings: number;
  filesAnalyzed: number;
}

// AST Types
export interface ImportInfo {
  module: string;
  line: number;
  column: number;
  isRelative: boolean;
  resolvedPath?: string;
}

export interface FileAnalysis {
  filePath: string;
  imports: ImportInfo[];
  exports: string[];
  functions: FunctionInfo[];
  layer?: string;
}

export interface FunctionInfo {
  name: string;
  line: number;
  column: number;
  body: string;
}

// Graph Types
export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  filePath: string;
  layer?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  importLine: number;
}

// CLI Types
export interface CLIOptions {
  config?: string;
  format?: 'json' | 'text';
  diff?: boolean;
  verbose?: boolean;
}
```

### 11. Initial Entry Points

Create `src/index.ts`:
```typescript
/**
 * Intent-Guard: Deterministic architectural controller for AI-generated code
 * 
 * Main entry point for programmatic usage
 */

export * from './types';
export * from './config/loader';
export * from './core/validators';

// Version
export const VERSION = '0.1.0';
```

Create `src/cli/index.ts`:
```typescript
#!/usr/bin/env node

/**
 * Intent-Guard CLI entry point
 */

import { Command } from 'commander';
import { VERSION } from '../index';

const program = new Command();

program
  .name('intent-guard')
  .description('Deterministic architectural controller for AI-generated code')
  .version(VERSION);

// Commands will be added in Phase 3
program.parse(process.argv);
```

### 12. Example Config for Self-Validation

Create `.intentguard/intent.config.yaml`:
```yaml
version: "1.0.0"

architecture:
  layers:
    - name: cli
      path: src/cli/**
      canImportFrom: [core, config, utils]
    
    - name: core
      path: src/core/**
      canImportFrom: [config, utils, types]
    
    - name: config
      path: src/config/**
      canImportFrom: [types, utils]
    
    - name: utils
      path: src/utils/**
      canImportFrom: [types]
    
    - name: types
      path: src/types/**
      canImportFrom: []

protectedRegions:
  - path: src/types/index.ts
    reason: "Core type definitions - changes require architecture review"
    aiMutable: false
```

---

## Implementation Steps

1. **Initialize npm project**:
   ```bash
   mkdir intent-guard
   cd intent-guard
   npm init -y
   ```

2. **Install dependencies**:
   ```bash
   npm install commander yaml chalk glob
   npm install -D typescript @types/node jest @types/jest ts-jest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier
   ```

3. **Create directory structure** (use mkdir commands or manually)

4. **Create all configuration files** (tsconfig.json, jest.config.js, etc.)

5. **Create initial source files** (src/types/index.ts, src/index.ts, src/cli/index.ts)

6. **Test the build**:
   ```bash
   npm run build
   ```

7. **Test the CLI**:
   ```bash
   node dist/cli/index.js --version
   ```

8. **Verify project structure** matches requirements

---

## Success Criteria

- ✅ Project builds without errors (`npm run build` succeeds)
- ✅ CLI executable runs (`node dist/cli/index.js --version` shows version)
- ✅ TypeScript compilation produces `.d.ts` files
- ✅ All configuration files are valid
- ✅ Directory structure matches specification
- ✅ `npm test` runs (even if no tests yet)
- ✅ ESLint runs without errors (`npm run lint`)
- ✅ Can import types: `import { IntentGuardConfig } from './types'`

---

## Validation

Run these commands to verify completion:

```bash
# Build should succeed
npm run build

# CLI should show version
node dist/cli/index.js --version

# Lint should pass
npm run lint

# Test should run (may show 0 tests)
npm test

# Check directory structure
ls -R src/
```

---

## Common Pitfalls

1. **Forgetting shebang**: `src/cli/index.ts` must start with `#!/usr/bin/env node`
2. **Wrong bin path**: `package.json` bin must point to compiled JS, not TS
3. **Missing types**: Ensure `@types/node` is installed
4. **Build output**: Verify `dist/` contains compiled JS files
5. **Module resolution**: Use `"moduleResolution": "node"` in tsconfig

---

## Next Steps

After completing this task:
1. Commit the project structure
2. Proceed to **Phase 1 - Task 2**: Configuration Loader and Validator
3. Update task.md to mark this task as complete

---

## References

- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Commander.js: https://github.com/tj/commander.js
- Jest Configuration: https://jestjs.io/docs/configuration

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
