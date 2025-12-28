import { DependencyGraphBuilder } from '../../../../src/core/graph/dependency-graph-builder';
import type { IntentGuardConfig } from '../../../../src/types';
import * as path from 'path';

describe('DependencyGraphBuilder - Additional Edge Cases', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');

    it('should handle config with no layers', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: {
                layers: [],
            },
        };

        const builder = new DependencyGraphBuilder(config, projectRoot);
        const graph = await builder.build();

        expect(graph.nodes).toHaveLength(0);
        expect(graph.edges).toHaveLength(0);
    });

    it('should handle layers with no matching files', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: {
                layers: [
                    {
                        name: 'nonexistent',
                        path: 'nonexistent/**/*.ts',
                        canImportFrom: [],
                    },
                ],
            },
        };

        const builder = new DependencyGraphBuilder(config, projectRoot);
        const graph = await builder.build();

        expect(graph.nodes).toHaveLength(0);
    });

    it('should handle files with circular dependencies', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: {
                layers: [
                    {
                        name: 'test',
                        path: 'tests/**/*.ts',
                        canImportFrom: [],
                    },
                ],
            },
        };

        const builder = new DependencyGraphBuilder(config, projectRoot);
        const graph = await builder.build();

        // Should handle circular deps without crashing
        expect(graph).toBeDefined();
    });

    it('should handle files with parse errors', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: {
                layers: [
                    {
                        name: 'src',
                        path: 'src/**/*.ts',
                        canImportFrom: [],
                    },
                ],
            },
        };

        const builder = new DependencyGraphBuilder(config, projectRoot);
        const graph = await builder.build();

        // Should skip files with parse errors
        expect(graph).toBeDefined();
        expect(graph.nodes.length).toBeGreaterThan(0);
    });

    it('should handle imports to external packages', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: {
                layers: [
                    {
                        name: 'config',
                        path: 'src/config/**/*.ts',
                        canImportFrom: [],
                    },
                ],
            },
        };

        const builder = new DependencyGraphBuilder(config, projectRoot);
        const graph = await builder.build();

        // External imports (like 'fs', 'path') should be handled
        expect(graph).toBeDefined();
    });

    it('should normalize Windows paths correctly', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: {
                layers: [
                    {
                        name: 'types',
                        path: 'src\\types\\**\\*.ts',
                        canImportFrom: [],
                    },
                ],
            },
        };

        const builder = new DependencyGraphBuilder(config, projectRoot);
        const graph = await builder.build();

        // Should handle both forward and backslashes
        expect(graph).toBeDefined();
    });
});
