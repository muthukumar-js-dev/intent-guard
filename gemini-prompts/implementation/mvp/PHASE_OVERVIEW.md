# Intent-Guard MVP Implementation - Phase Overview

## Project Goal
Build the MVP (v0.1.0) of intent-guard: a deterministic architectural controller that validates AI-generated code against human-defined intent and architectural boundaries.

---

## Phase Breakdown

### **Phase 1: Project Foundation & Core Infrastructure**
**Duration**: 2-3 days  
**Goal**: Establish project structure, configuration system, and AST parsing foundation

**Tasks**:
1. Project structure and configuration setup
2. Configuration loader and schema validator
3. AST parser abstraction layer

**Success Criteria**:
- ✅ Project builds successfully with TypeScript
- ✅ Can load and validate `.intentguard/intent.config.yaml`
- ✅ AST parser can extract imports from TS/JS files

---

### **Phase 2: Core Validation Engine**
**Duration**: 4-5 days  
**Goal**: Implement core validation rules that enforce architectural boundaries

**Tasks**:
1. Dependency graph builder
2. Layer boundary validator
3. Protected regions validator
4. Banned dependencies checker

**Success Criteria**:
- ✅ Can detect layer boundary violations
- ✅ Can prevent modifications to protected regions
- ✅ Can identify banned imports/packages
- ✅ Validation results include file, line, and actionable messages

---

### **Phase 3: CLI Development**
**Duration**: 3-4 days  
**Goal**: Build user-facing CLI with essential commands

**Tasks**:
1. CLI framework and command structure
2. `init` command implementation
3. `validate` command implementation
4. `rules-for` command implementation
5. Output formatters (JSON & human-readable)

**Success Criteria**:
- ✅ `npx intent-guard init` creates config files
- ✅ `npx intent-guard validate` runs all validators
- ✅ `npx intent-guard rules-for <path>` returns path-specific rules
- ✅ Output is both human-readable and machine-parseable

---

### **Phase 4: Integration & Testing**
**Duration**: 3-4 days  
**Goal**: Ensure reliability through comprehensive testing

**Tasks**:
1. Unit tests for all validators
2. Integration tests for CLI commands
3. Example projects for real-world testing
4. Documentation and README

**Success Criteria**:
- ✅ >90% code coverage
- ✅ All edge cases tested
- ✅ Example projects validate successfully
- ✅ Clear documentation for adoption

---

### **Phase 5: Publishing & Distribution**
**Duration**: 1-2 days  
**Goal**: Prepare and publish to npm

**Tasks**:
1. Package preparation (package.json, LICENSE, etc.)
2. GitHub repository and CI/CD setup
3. Publish v0.1.0 to npm

**Success Criteria**:
- ✅ Package published to npm
- ✅ CI/CD runs tests on every commit
- ✅ README includes installation and usage instructions

---

## Total Estimated Duration
**13-18 days** for complete MVP

---

## MVP Feature Scope

### ✅ Included in MVP
- Layer boundary validation
- Protected region enforcement
- Banned dependency detection
- CLI with `init`, `validate`, `rules-for` commands
- JSON and human-readable output
- TypeScript/JavaScript support
- Configuration via YAML

### ❌ Excluded from MVP (Future Phases)
- Semantic duplication detection (requires embeddings)
- MCP server integration
- Auto-fix capabilities
- Architectural drift detection
- Custom rule plugins
- IDE extensions

---

## Development Principles

1. **Test-Driven Development**: Write tests before implementation
2. **Incremental Delivery**: Each phase produces working software
3. **Documentation-First**: Document APIs before coding
4. **Zero External Dependencies**: No AI APIs, minimal npm dependencies
5. **Framework-Agnostic**: Works with any JS/TS project

---

## Next Steps

1. Read all task prompts in this directory
2. Start with Phase 1, Task 1
3. Complete each task sequentially
4. Update task.md as you progress
5. Review and test after each phase

---

**Document Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
