import { LayerBoundaryValidator } from '../../../../src/core/validators/layer-boundary-validator';
import { DependencyGraphBuilder } from '../../../../src/core/graph/dependency-graph-builder';
import type { IntentGuardConfig, DependencyGraph } from '../../../../src/types';

describe('LayerBoundaryValidator', () => {
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

    it('should pass when no violations exist', () => {
        const graph: DependencyGraph = {
            nodes: [
                { id: 'presentation/app.ts', filePath: 'presentation/app.ts', layer: 'presentation' },
                { id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' },
            ],
            edges: [
                { from: 'presentation/app.ts', to: 'domain/user.ts', importLine: 1 },
            ],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        expect(result.valid).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    it('should detect layer boundary violations', () => {
        const graph: DependencyGraph = {
            nodes: [
                { id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' },
                { id: 'infrastructure/db.ts', filePath: 'infrastructure/db.ts', layer: 'infrastructure' },
            ],
            edges: [
                // Domain cannot import from infrastructure
                { from: 'domain/user.ts', to: 'infrastructure/db.ts', importLine: 5 },
            ],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        expect(result.valid).toBe(false);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].ruleId).toBe('layer-boundary');
        expect(result.violations[0].severity).toBe('error');
        expect(result.violations[0].file).toBe('domain/user.ts');
        expect(result.violations[0].line).toBe(5);
    });

    it('should provide actionable error messages', () => {
        const graph: DependencyGraph = {
            nodes: [
                { id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' },
                { id: 'presentation/ui.ts', filePath: 'presentation/ui.ts', layer: 'presentation' },
            ],
            edges: [
                { from: 'domain/user.ts', to: 'presentation/ui.ts', importLine: 10 },
            ],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        expect(result.violations[0].message).toContain('cannot import from');
        expect(result.violations[0].suggestion).toBeDefined();
    });

    it('should handle nodes without layers', () => {
        const graph: DependencyGraph = {
            nodes: [
                { id: 'unknown/file.ts', filePath: 'unknown/file.ts', layer: undefined },
                { id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' },
            ],
            edges: [
                { from: 'unknown/file.ts', to: 'domain/user.ts', importLine: 1 },
            ],
        };

        const validator = new LayerBoundaryValidator(testConfig, graph, process.cwd());
        const result = validator.validate();

        // Should not throw, just skip nodes without layers
        expect(result.valid).toBe(true);
    });

    it('should count errors and warnings correctly', () => {
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

        expect(result.summary.errors).toBe(2);
        expect(result.summary.filesAnalyzed).toBe(3);
    });

    it('should detect cannotImportFrom violations', () => {
        const configWithForbidden: IntentGuardConfig = {
            version: '1.0.0',
            architecture: {
                layers: [
                    {
                        name: 'domain',
                        path: 'domain/**',
                        canImportFrom: [],
                        cannotImportFrom: ['infrastructure'],
                    },
                    {
                        name: 'infrastructure',
                        path: 'infrastructure/**',
                        canImportFrom: ['domain'],
                    },
                ],
            },
        };

        const graph: DependencyGraph = {
            nodes: [
                { id: 'domain/user.ts', filePath: 'domain/user.ts', layer: 'domain' },
                { id: 'infrastructure/db.ts', filePath: 'infrastructure/db.ts', layer: 'infrastructure' },
            ],
            edges: [
                { from: 'domain/user.ts', to: 'infrastructure/db.ts', importLine: 5 },
            ],
        };

        const validator = new LayerBoundaryValidator(configWithForbidden, graph, process.cwd());
        const result = validator.validate();

        expect(result.valid).toBe(false);
        expect(result.violations).toHaveLength(2); // Both canImportFrom and cannotImportFrom violations

        const forbiddenViolation = result.violations.find(v => v.ruleId === 'layer-boundary-forbidden');
        expect(forbiddenViolation).toBeDefined();
        expect(forbiddenViolation?.message).toContain('explicitly cannot import');
        expect(forbiddenViolation?.severity).toBe('error');
    });
});

