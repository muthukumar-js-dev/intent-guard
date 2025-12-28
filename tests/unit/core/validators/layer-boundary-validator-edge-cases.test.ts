import { LayerBoundaryValidator } from '../../../../src/core/validators/layer-boundary-validator';
import type { IntentGuardConfig, DependencyGraph } from '../../../../src/types';

describe('LayerBoundaryValidator - Edge Cases', () => {
    const testConfig: IntentGuardConfig = {
        version: '1.0.0',
        architecture: {
            layers: [
                {
                    name: 'presentation',
                    path: 'presentation/**',
                    canImportFrom: ['domain', 'infrastructure'],
                },
                {
                    name: 'domain',
                    path: 'domain/**',
                    canImportFrom: [],
                },
                {
                    name: 'infrastructure',
                    path: 'infrastructure/**',
                    canImportFrom: ['domain'],
                },
            ],
        },
    };

    it('should handle nodes with undefined layer', () => {
        const graph: DependencyGraph = {
            nodes: [
                { id: 'unknown/file.ts', filePath: 'unknown/file.ts', layer: undefined },
                { id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' },
            ],
            edges: [{ from: 'unknown/file.ts', to: 'domain/user.ts', importLine: 1 }],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        expect(result.valid).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    it('should handle nodes with null layer', () => {
        const graph: DependencyGraph = {
            nodes: [
                { id: 'test.ts', filePath: 'test.ts', layer: null as any },
                { id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' },
            ],
            edges: [{ from: 'test.ts', to: 'domain/user.ts', importLine: 1 }],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        expect(result.valid).toBe(true);
    });

    it('should handle missing fromNode', () => {
        const graph: DependencyGraph = {
            nodes: [{ id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' }],
            edges: [{ from: 'nonexistent.ts', to: 'domain/user.ts', importLine: 1 }],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        expect(result.valid).toBe(true);
    });

    it('should handle missing toNode', () => {
        const graph: DependencyGraph = {
            nodes: [{ id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' }],
            edges: [{ from: 'domain/user.ts', to: 'nonexistent.ts', importLine: 1 }],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        expect(result.valid).toBe(true);
    });

    it('should handle layer not found in config', () => {
        const graph: DependencyGraph = {
            nodes: [
                { id: 'test.ts', filePath: 'test.ts', layer: 'unknown-layer' },
                { id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' },
            ],
            edges: [{ from: 'test.ts', to: 'domain/user.ts', importLine: 1 }],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        expect(result.valid).toBe(true);
    });

    it('should handle empty graph', () => {
        const graph: DependencyGraph = {
            nodes: [],
            edges: [],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        expect(result.valid).toBe(true);
        expect(result.summary.filesAnalyzed).toBe(0);
    });

    it('should handle multiple violations from same file', () => {
        const graph: DependencyGraph = {
            nodes: [
                { id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' },
                { id: 'infrastructure/db.ts', filePath: 'infrastructure/db.ts', layer: 'infrastructure' },
                { id: 'presentation/ui.ts', filePath: 'presentation/ui.ts', layer: 'presentation' },
            ],
            edges: [
                { from: 'domain/user.ts', to: 'infrastructure/db.ts', importLine: 5 },
                { from: 'domain/user.ts', to: 'presentation/ui.ts', importLine: 10 },
            ],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        expect(result.valid).toBe(false);
        expect(result.violations).toHaveLength(2);
        expect(result.summary.errors).toBe(2);
    });

    it('should handle warnings correctly', () => {
        const graph: DependencyGraph = {
            nodes: [
                { id: 'presentation/app.ts', filePath: 'presentation/app.ts', layer: 'presentation' },
                { id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' },
            ],
            edges: [{ from: 'presentation/app.ts', to: 'domain/user.ts', importLine: 1 }],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        expect(result.summary.warnings).toBe(0);
    });
});

