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


// Cache Types
export interface CacheData {
    version: string;
    entries: Record<string, CacheEntry>;
}

export interface CacheEntry {
    hash: string;
    imports: {
        module: string;
        line: number;
    }[];
}

// Memory Types
export interface MemoryData {
    version: string;
    lastUpdated: string;
    baseline: {
        errors: number;
        warnings: number;
    };
    snapshot?: ValidationSummary;
}
