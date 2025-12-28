# P2 Tasks: Future Enhancements

## P2 Task 1: Incremental Analysis

**Time**: 1-2 days  
**Complexity**: High

Implement caching of AST results and only re-parse changed files.

**Approach**:
1. Store file hashes and parsed results in `.intentguard/cache/`
2. On validation, check file hash against cache
3. Only re-parse if hash changed
4. Update dependency graph incrementally

**Files to Create**:
- `src/core/cache/file-cache.ts`
- `src/core/cache/hash-utils.ts`

---

## P2 Task 2: Remove Unused Parser Features

**Time**: 2 hours  
**Complexity**: Low

Remove function/class extraction from parsers since validators don't use them.

**OR** document why they exist (for future semantic analysis features).

---

## P2 Task 3: Enhance Documentation

**Time**: 1 day  
**Complexity**: Medium

Add:
- Advanced configuration examples
- Troubleshooting guide
- FAQ section
- Performance tuning tips
- Architecture decision records (ADRs)

**Files to Create**:
- `docs/advanced-configuration.md`
- `docs/troubleshooting.md`
- `docs/faq.md`
- `docs/performance.md`

---

## P2 Task 4: Add npm Badges

**Time**: 30 minutes  
**Complexity**: Low

Add to README.md:

```markdown
[![npm version](https://badge.fury.io/js/intent-guard.svg)](https://www.npmjs.com/package/intent-guard)
[![CI](https://github.com/muthu-kumar369/intent-guard/workflows/CI/badge.svg)](https://github.com/muthu-kumar369/intent-guard/actions)
[![Coverage](https://codecov.io/gh/muthu-kumar369/intent-guard/branch/main/graph/badge.svg)](https://codecov.io/gh/muthu-kumar369/intent-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

Requires:
- npm package published
- GitHub Actions CI setup
- Codecov integration (optional)
