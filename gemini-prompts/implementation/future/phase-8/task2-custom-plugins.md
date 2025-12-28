# Phase 8 - Task 2: Custom Rule Plugins

## Task Overview
**Phase**: 8 - Advanced Governance  
**Task**: 2 of 4  
**Estimated Time**: 1-2 weeks  
**Complexity**: High

---

## Objective
Create a plugin system that allows developers to write custom validation rules.

---

## Requirements

### 1. Plugin API

Create `src/plugins/plugin-api.ts`:

```typescript
export interface ValidationPlugin {
  name: string;
  version: string;
  validate(context: ValidationContext): Promise<ValidationResult>;
}

export interface ValidationContext {
  file: string;
  ast: any;
  config: IntentGuardConfig;
  graph: DependencyGraph;
}
```

### 2. Plugin Loader

Create `src/plugins/plugin-loader.ts` that:
- Discovers plugins in `node_modules/@intent-guard/plugin-*`
- Loads and validates plugins
- Executes plugins during validation
- Handles plugin errors gracefully

### 3. Example Plugin

Create example plugin package:
```typescript
// @intent-guard/plugin-no-console

export class NoConsolePlugin implements ValidationPlugin {
  name = 'no-console';
  version = '1.0.0';

  async validate(context: ValidationContext): Promise<ValidationResult> {
    // Check for console.log statements
    const violations = [];
    
    // ... implementation
    
    return { valid: violations.length === 0, violations };
  }
}
```

---

## Success Criteria

- ✅ Plugin API is stable
- ✅ Plugins can be npm packages
- ✅ Plugin loader works correctly
- ✅ >10 community plugins created
- ✅ Documentation for plugin authors

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
