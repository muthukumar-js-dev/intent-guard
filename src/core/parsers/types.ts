/**
 * Common types for AST parsers
 */

export interface ImportInfo {
    module: string; // Module specifier (e.g., './utils', 'lodash')
    line: number; // Line number (1-indexed)
    column: number; // Column number (0-indexed)
    isRelative: boolean; // true if starts with . or ..
    resolvedPath?: string; // Absolute path (if resolvable)
    importedNames?: string[]; // Named imports (e.g., ['foo', 'bar'])
    isDefault?: boolean; // true if default import
    isNamespace?: boolean; // true if namespace import (import * as)
    isDynamic?: boolean; // true if dynamic import (import())
    isRequire?: boolean; // true if CommonJS require()
}

export interface ExportInfo {
    name: string; // Export name
    line: number;
    column: number;
    isDefault: boolean; // true if default export
    isReExport: boolean; // true if re-exporting from another module
    fromModule?: string; // Source module if re-export
}

export interface FunctionInfo {
    name: string; // Function name (or '<anonymous>')
    line: number;
    column: number;
    endLine: number;
    body: string; // Function body as string
    params: string[]; // Parameter names
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

/**
 * Result of parsing a single file
 * 
 * @remarks
 * The `functions` and `classes` fields are currently unused by validators but are
 * extracted for potential future semantic analysis features, such as:
 * - Detecting unused exports
 * - Analyzing function complexity
 * - Enforcing naming conventions
 * - Semantic dependency analysis (e.g., which functions call which)
 * 
 * Current validators only use `imports` and `exports` for architectural validation.
 */
export interface FileAnalysis {
    filePath: string;
    language: 'typescript' | 'javascript';

    /** Import statements - USED by LayerBoundaryValidator and BannedDependenciesValidator */
    imports: ImportInfo[];

    /** Export statements - USED by dependency graph builder */
    exports: ExportInfo[];

    /** Function declarations - RESERVED for future semantic analysis */
    functions: FunctionInfo[];

    /** Class declarations - RESERVED for future semantic analysis */
    classes: ClassInfo[];

    /** Parse errors encountered */
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
