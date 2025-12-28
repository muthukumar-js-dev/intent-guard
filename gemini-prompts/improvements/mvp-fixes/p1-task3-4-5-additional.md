# P1 Task 3-5: Additional P1 Improvements

## P1 Task 3: Improve Protected Regions Example

**Time**: 1 hour

Update `examples/protected-region/` to work with --diff mode or remove if feature is removed in P0 Task 1.

---

## P1 Task 4: Add Config Caching

**Time**: 2 hours

Cache parsed config in memory to avoid re-parsing:

```typescript
// src/config/loader.ts
private static configCache: Map<string, IntentGuardConfig> = new Map();

static load(startDir: string = process.cwd()): IntentGuardConfig {
    const configPath = this.findConfigFile(startDir);
    
    if (this.configCache.has(configPath)) {
        return this.configCache.get(configPath)!;
    }
    
    const config = this.loadFromFile(configPath);
    this.configCache.set(configPath, config);
    return config;
}
```

---

## P1 Task 5: Improve Error Messages

**Time**: 2-3 hours

Make suggestions more specific:

```typescript
// Instead of: "Move this logic to domain or application layer"
// Provide: "Move this logic to src/domain/services/ or src/application/use-cases/"

violations.push({
    message: `Layer "${fromLayer.name}" cannot import from "${toNode.layer}"`,
    suggestion: `Allowed imports: ${fromLayer.canImportFrom.map(l => {
        const layer = config.architecture.layers.find(x => x.name === l);
        return `${l} (${layer?.path})`;
    }).join(', ')}`,
});
```

Add context to all error messages:
- Show file path relative to project root
- Show layer name in violation
- Suggest specific directories, not just layer names
