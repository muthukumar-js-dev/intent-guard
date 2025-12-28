# Phase 1 - Task 2: Configuration Loader and Schema Validator

## Task Overview
**Phase**: 1 - Project Foundation & Core Infrastructure  
**Task**: 2 of 3  
**Estimated Time**: 4-5 hours  
**Complexity**: Medium-High

---

## Objective
Build a robust configuration loader that reads, validates, and parses `.intentguard/intent.config.yaml` files. This is the foundation for all validation rules and must handle errors gracefully with helpful messages.

---

## Context
The configuration file is the single source of truth for architectural rules. It defines:
- Layer boundaries (what can import what)
- Protected regions (AI-read-only code)
- Banned dependencies
- Intent registry (future)

The loader must:
- Support YAML format
- Validate against a strict schema
- Provide helpful error messages for invalid configs
- Support default values
- Be extensible for future config options

---

## Requirements

### 1. Configuration Schema Definition

Create `src/config/schema.ts`:

```typescript
import { IntentGuardConfig } from '../types';

/**
 * JSON Schema for intent.config.yaml validation
 */
export const CONFIG_SCHEMA = {
  type: 'object',
  required: ['version', 'architecture'],
  properties: {
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
      description: 'Config version (semver format)'
    },
    architecture: {
      type: 'object',
      required: ['layers'],
      properties: {
        layers: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['name', 'path', 'canImportFrom'],
            properties: {
              name: {
                type: 'string',
                pattern: '^[a-z][a-z0-9-]*$',
                description: 'Layer name (lowercase, alphanumeric with hyphens)'
              },
              path: {
                type: 'string',
                description: 'Glob pattern for layer files'
              },
              canImportFrom: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of layer names this layer can import from'
              },
              cannotImportFrom: {
                type: 'array',
                items: { type: 'string' },
                description: 'Explicit list of forbidden imports (optional)'
              }
            }
          }
        }
      }
    },
    intents: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'description', 'location', 'mutable'],
        properties: {
          id: {
            type: 'string',
            pattern: '^[a-z][a-z0-9-]*$'
          },
          description: { type: 'string' },
          location: { type: 'string' },
          mutable: { type: 'boolean' },
          semanticHash: { type: 'string' }
        }
      }
    },
    protectedRegions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'reason', 'aiMutable'],
        properties: {
          path: { type: 'string' },
          reason: { type: 'string' },
          aiMutable: { type: 'boolean' }
        }
      }
    },
    bannedDependencies: {
      type: 'array',
      items: {
        type: 'object',
        required: ['reason'],
        properties: {
          package: { type: 'string' },
          pattern: { type: 'string' },
          reason: { type: 'string' },
          alternatives: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    }
  }
};

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<IntentGuardConfig> = {
  version: '1.0.0',
  intents: [],
  protectedRegions: [],
  bannedDependencies: []
};
```

### 2. Configuration Loader Implementation

Create `src/config/loader.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { IntentGuardConfig } from '../types';
import { CONFIG_SCHEMA, DEFAULT_CONFIG } from './schema';
import { validateSchema } from './validator';

export class ConfigLoader {
  private static readonly CONFIG_FILE_NAME = 'intent.config.yaml';
  private static readonly CONFIG_DIR_NAME = '.intentguard';

  /**
   * Find and load configuration file from project root
   * @param startDir - Directory to start searching from (defaults to cwd)
   * @returns Loaded and validated configuration
   * @throws Error if config not found or invalid
   */
  static load(startDir: string = process.cwd()): IntentGuardConfig {
    const configPath = this.findConfigFile(startDir);
    
    if (!configPath) {
      throw new Error(
        `Configuration file not found. Expected: .intentguard/intent.config.yaml\n` +
        `Run 'npx intent-guard init' to create a configuration file.`
      );
    }

    return this.loadFromFile(configPath);
  }

  /**
   * Load configuration from specific file path
   * @param filePath - Absolute path to config file
   * @returns Loaded and validated configuration
   */
  static loadFromFile(filePath: string): IntentGuardConfig {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = yaml.parse(fileContent);
      
      // Merge with defaults
      const config: IntentGuardConfig = {
        ...DEFAULT_CONFIG,
        ...parsed
      };

      // Validate against schema
      const validation = validateSchema(config, CONFIG_SCHEMA);
      
      if (!validation.valid) {
        throw new Error(
          `Invalid configuration file: ${filePath}\n` +
          validation.errors.map(e => `  - ${e}`).join('\n')
        );
      }

      // Additional semantic validation
      this.validateSemantics(config);

      return config;
    } catch (error) {
      if (error instanceof yaml.YAMLParseError) {
        throw new Error(
          `Failed to parse YAML configuration: ${filePath}\n` +
          `Error: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Find config file by walking up directory tree
   * @param startDir - Directory to start searching from
   * @returns Absolute path to config file, or null if not found
   */
  private static findConfigFile(startDir: string): string | null {
    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      const configPath = path.join(
        currentDir,
        this.CONFIG_DIR_NAME,
        this.CONFIG_FILE_NAME
      );

      if (fs.existsSync(configPath)) {
        return configPath;
      }

      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  /**
   * Validate semantic rules that can't be expressed in JSON schema
   * @param config - Configuration to validate
   * @throws Error if semantic validation fails
   */
  private static validateSemantics(config: IntentGuardConfig): void {
    // Check for duplicate layer names
    const layerNames = config.architecture.layers.map(l => l.name);
    const duplicates = layerNames.filter(
      (name, index) => layerNames.indexOf(name) !== index
    );
    
    if (duplicates.length > 0) {
      throw new Error(
        `Duplicate layer names found: ${duplicates.join(', ')}\n` +
        `Each layer must have a unique name.`
      );
    }

    // Check that canImportFrom references valid layers
    for (const layer of config.architecture.layers) {
      for (const importFrom of layer.canImportFrom) {
        if (!layerNames.includes(importFrom)) {
          throw new Error(
            `Layer "${layer.name}" references unknown layer "${importFrom}" in canImportFrom.\n` +
            `Available layers: ${layerNames.join(', ')}`
          );
        }
      }

      // Check cannotImportFrom if present
      if (layer.cannotImportFrom) {
        for (const cannotImport of layer.cannotImportFrom) {
          if (!layerNames.includes(cannotImport)) {
            throw new Error(
              `Layer "${layer.name}" references unknown layer "${cannotImport}" in cannotImportFrom.\n` +
              `Available layers: ${layerNames.join(', ')}`
            );
          }
        }
      }
    }

    // Check for circular dependencies (optional, but good to have)
    this.detectCircularDependencies(config.architecture.layers);

    // Validate banned dependencies have either package or pattern
    if (config.bannedDependencies) {
      for (const banned of config.bannedDependencies) {
        if (!banned.package && !banned.pattern) {
          throw new Error(
            `Banned dependency must specify either 'package' or 'pattern'.\n` +
            `Reason: ${banned.reason}`
          );
        }
      }
    }
  }

  /**
   * Detect circular dependencies in layer definitions
   * @param layers - Layer definitions to check
   * @throws Error if circular dependency detected
   */
  private static detectCircularDependencies(layers: any[]): void {
    const graph = new Map<string, Set<string>>();
    
    // Build adjacency list
    for (const layer of layers) {
      graph.set(layer.name, new Set(layer.canImportFrom));
    }

    // DFS to detect cycles
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);

      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const layer of layers) {
      if (!visited.has(layer.name)) {
        if (hasCycle(layer.name)) {
          throw new Error(
            `Circular dependency detected in layer definitions.\n` +
            `This creates an invalid architecture. Please review your canImportFrom rules.`
          );
        }
      }
    }
  }

  /**
   * Get the project root directory (where .intentguard/ is located)
   * @param startDir - Directory to start searching from
   * @returns Absolute path to project root, or null if not found
   */
  static findProjectRoot(startDir: string = process.cwd()): string | null {
    const configPath = this.findConfigFile(startDir);
    if (!configPath) return null;
    
    // Project root is parent of .intentguard/
    return path.dirname(path.dirname(configPath));
  }
}
```

### 3. Schema Validator Implementation

Create `src/config/validator.ts`:

```typescript
/**
 * Simple JSON schema validator
 * (In production, consider using ajv or similar library)
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSchema(data: any, schema: any): ValidationResult {
  const errors: string[] = [];

  function validate(value: any, schemaNode: any, path: string = 'root'): void {
    // Check required fields
    if (schemaNode.required && typeof value === 'object') {
      for (const requiredField of schemaNode.required) {
        if (!(requiredField in value)) {
          errors.push(`Missing required field: ${path}.${requiredField}`);
        }
      }
    }

    // Check type
    if (schemaNode.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== schemaNode.type) {
        errors.push(
          `Type mismatch at ${path}: expected ${schemaNode.type}, got ${actualType}`
        );
        return; // Don't continue if type is wrong
      }
    }

    // Check pattern (for strings)
    if (schemaNode.pattern && typeof value === 'string') {
      const regex = new RegExp(schemaNode.pattern);
      if (!regex.test(value)) {
        errors.push(
          `Value at ${path} does not match pattern ${schemaNode.pattern}: "${value}"`
        );
      }
    }

    // Check array items
    if (schemaNode.type === 'array' && Array.isArray(value)) {
      if (schemaNode.minItems && value.length < schemaNode.minItems) {
        errors.push(
          `Array at ${path} has ${value.length} items, minimum is ${schemaNode.minItems}`
        );
      }

      if (schemaNode.items) {
        value.forEach((item, index) => {
          validate(item, schemaNode.items, `${path}[${index}]`);
        });
      }
    }

    // Check object properties
    if (schemaNode.type === 'object' && schemaNode.properties) {
      for (const [key, propSchema] of Object.entries(schemaNode.properties)) {
        if (key in value) {
          validate(value[key], propSchema, `${path}.${key}`);
        }
      }
    }
  }

  validate(data, schema);

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 4. Export from config module

Create `src/config/index.ts`:

```typescript
export { ConfigLoader } from './loader';
export { CONFIG_SCHEMA, DEFAULT_CONFIG } from './schema';
export { validateSchema } from './validator';
```

---

## Implementation Steps

1. **Create schema definition** (`src/config/schema.ts`)
   - Define JSON schema for validation
   - Define default config values

2. **Create validator** (`src/config/validator.ts`)
   - Implement basic JSON schema validation
   - Return helpful error messages

3. **Create loader** (`src/config/loader.ts`)
   - Implement file discovery (walk up directory tree)
   - Implement YAML parsing
   - Implement schema validation
   - Implement semantic validation (circular deps, etc.)

4. **Create index** (`src/config/index.ts`)
   - Export all public APIs

5. **Write unit tests** (`tests/unit/config/loader.test.ts`)

---

## Unit Tests Required

Create `tests/unit/config/loader.test.ts`:

```typescript
import { ConfigLoader } from '../../../src/config/loader';
import * as fs from 'fs';
import * as path from 'path';

describe('ConfigLoader', () => {
  describe('loadFromFile', () => {
    it('should load valid config file', () => {
      // Test with valid YAML
    });

    it('should throw error for invalid YAML syntax', () => {
      // Test with malformed YAML
    });

    it('should throw error for missing required fields', () => {
      // Test with incomplete config
    });

    it('should throw error for duplicate layer names', () => {
      // Test semantic validation
    });

    it('should throw error for circular dependencies', () => {
      // Test circular dependency detection
    });

    it('should throw error for invalid layer references', () => {
      // Test canImportFrom validation
    });
  });

  describe('findConfigFile', () => {
    it('should find config in current directory', () => {
      // Test file discovery
    });

    it('should find config in parent directory', () => {
      // Test walking up directory tree
    });

    it('should return null if config not found', () => {
      // Test failure case
    });
  });

  describe('findProjectRoot', () => {
    it('should return project root directory', () => {
      // Test root discovery
    });
  });
});
```

Create test fixtures in `tests/fixtures/configs/`:
- `valid-config.yaml` - Valid configuration
- `invalid-yaml.yaml` - Malformed YAML
- `missing-required.yaml` - Missing required fields
- `duplicate-layers.yaml` - Duplicate layer names
- `circular-deps.yaml` - Circular dependencies
- `invalid-references.yaml` - Invalid layer references

---

## Success Criteria

- ✅ Can load valid config file without errors
- ✅ Throws helpful error for invalid YAML syntax
- ✅ Throws helpful error for missing required fields
- ✅ Detects duplicate layer names
- ✅ Detects circular dependencies
- ✅ Detects invalid layer references in canImportFrom
- ✅ Can find config file by walking up directory tree
- ✅ Returns project root directory correctly
- ✅ All unit tests pass
- ✅ Code coverage >90% for config module

---

## Validation

Run these commands to verify completion:

```bash
# Build should succeed
npm run build

# Tests should pass
npm test tests/unit/config/

# Try loading the example config
node -e "const { ConfigLoader } = require('./dist/config'); console.log(ConfigLoader.load());"
```

---

## Common Pitfalls

1. **YAML parsing errors**: Handle `yaml.YAMLParseError` specifically
2. **Path resolution**: Use `path.resolve()` for absolute paths
3. **Circular dependency detection**: Implement proper DFS with recursion stack
4. **Error messages**: Make them actionable (tell user how to fix)
5. **Default values**: Merge defaults before validation

---

## Next Steps

After completing this task:
1. Verify all tests pass
2. Test with the example `.intentguard/intent.config.yaml`
3. Proceed to **Phase 1 - Task 3**: AST Parser Abstraction Layer
4. Update task.md to mark this task as complete

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
