# Performance Guide

Optimizing Intent Guard for speed and efficiency in large codebases.

## Best Practices

### 1. Optimize Globs
Be as specific as possible with your layer definitions. 
**Bad:** `path: **/*.ts` (Scans everything)
**Good:** `path: src/domain/**/*.ts`

### 2. Exclude Heavy Directories
Ensure `node_modules` and any build output directories (`dist`, `build`, `.next`, etc.) are not included in your layer paths. While Intent Guard has some defaults, explicit scoping via specific positive globs is faster than broad globs.

### 3. Use Incremental Checks (Coming Soon)
We are working on caching mechanisms to only re-parse files that have changed. This will be the biggest performance booster for local development.

### 4. CI Optimization
In CI environments, you can optimize by ensuring you only run validation on relevant branches or file changes if possible, though running a full validation is safer to catch indirect architectural regressions.

## Benchmarks
(Benchmarks to be added as the project matures)
