import { DependencyGraphBuilder } from '../../../../src/core/graph/dependency-graph-builder';
import { ConfigLoader } from '../../../../src/config';
import * as path from 'path';

describe('DependencyGraphBuilder', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');

    it('should build graph for project', async () => {
        // Use actual project config
        const config = ConfigLoader.load(projectRoot);
        const builder = new DependencyGraphBuilder(config, projectRoot);
        const graph = await builder.build();

        expect(graph.nodes).toBeDefined();
        expect(graph.edges).toBeDefined();
        expect(graph.nodes.length).toBeGreaterThan(0);
    });

    it('should assign files to correct layers', async () => {
        const config = ConfigLoader.load(projectRoot);
        const builder = new DependencyGraphBuilder(config, projectRoot);
        const graph = await builder.build();

        // Check that files are assigned to layers
        const cliNode = graph.nodes.find((n) => n.filePath.includes('src/cli'));
        const configNode = graph.nodes.find((n) => n.filePath.includes('src/config'));

        if (cliNode) {
            expect(cliNode.layer).toBe('cli');
        }
        if (configNode) {
            expect(configNode.layer).toBe('config');
        }
    });

    it('should create edges for imports', async () => {
        const config = ConfigLoader.load(projectRoot);
        const builder = new DependencyGraphBuilder(config, projectRoot);
        const graph = await builder.build();

        // Should have some edges
        expect(graph.edges.length).toBeGreaterThan(0);

        // Each edge should have required properties
        for (const edge of graph.edges) {
            expect(edge.from).toBeDefined();
            expect(edge.to).toBeDefined();
            expect(edge.importLine).toBeGreaterThan(0);
        }
    });

    it('should handle empty config gracefully', async () => {
        const emptyConfig = {
            version: '1.0.0',
            architecture: {
                layers: [],
            },
        };

        const builder = new DependencyGraphBuilder(emptyConfig, projectRoot);
        const graph = await builder.build();

        // Should not throw, just return empty graph
        expect(graph.nodes).toEqual([]);
        expect(graph.edges).toEqual([]);
    });
});
