# Parser Features Documentation

## Current Usage

### Used Features
- ✅ **imports** - Used by `LayerBoundaryValidator` and `BannedDependenciesValidator`
- ✅ **exports** - Used by `DependencyGraphBuilder` to build module relationships

### Reserved Features (Currently Unused)
- 📦 **functions** - Reserved for future semantic analysis
- 📦 **classes** - Reserved for future semantic analysis

## Why Keep Unused Features?

The `functions` and `classes` fields in `FileAnalysis` are currently extracted but not used by any validators. They are intentionally kept for future enhancements:

### Potential Future Features

1. **Unused Export Detection**
   - Detect exported functions/classes that are never imported
   - Help identify dead code

2. **Complexity Analysis**
   - Analyze function complexity (cyclomatic complexity)
   - Enforce maximum function length
   - Detect overly complex classes

3. **Naming Convention Enforcement**
   - Validate function/class naming patterns
   - Enforce consistent naming across layers

4. **Semantic Dependency Analysis**
   - Track which functions call which other functions
   - Detect circular dependencies at function level
   - Analyze coupling between classes

5. **AI-Specific Rules**
   - Detect when AI generates overly complex functions
   - Enforce simplicity constraints for AI-generated code

## Performance Impact

The extraction of functions and classes has minimal performance impact:
- Parsing is already traversing the entire AST
- Extracting this data adds negligible overhead
- The data is small compared to the full AST

## Decision

**Keep and document** rather than remove because:
- Low maintenance cost
- High potential future value
- Minimal performance impact
- Easier to keep than to re-add later
