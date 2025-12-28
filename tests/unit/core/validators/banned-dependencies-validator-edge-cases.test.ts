import { BannedDependenciesValidator } from '../../../../src/core/validators/banned-dependencies-validator';
import type { IntentGuardConfig, DependencyGraph } from '../../../../src/types';
import * as path from 'path';

describe('BannedDependenciesValidator - Edge Cases', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');

    it('should handle undefined bannedDependencies', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            // bannedDependencies is undefined
        };

        const graph: DependencyGraph = {
            nodes: [
                {
                    id: 'src/types/index.ts',
                    filePath: path.join(projectRoot, 'src/types/index.ts'),
                    layer: 'types',
                },
            ],
            edges: [],
        };

        const validator = new BannedDependenciesValidator(config, graph);
        const result = await validator.validate();

        expect(result.valid).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    it('should handle empty bannedDependencies array', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            bannedDependencies: [],
        };

        const graph: DependencyGraph = {
            nodes: [
                {
                    id: 'src/types/index.ts',
                    filePath: path.join(projectRoot, 'src/types/index.ts'),
                    layer: 'types',
                },
            ],
            edges: [],
        };

        const validator = new BannedDependenciesValidator(config, graph);
        const result = await validator.validate();

        expect(result.valid).toBe(true);
    });

    it('should handle nodes without parser support', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            bannedDependencies: [
                {
                    package: 'lodash',
                    reason: 'Use native',
                },
            ],
        };

        const graph: DependencyGraph = {
            nodes: [
                {
                    id: 'src/app.py',
                    filePath: path.join(projectRoot, 'src/app.py'),
                    layer: 'app',
                },
            ],
            edges: [],
        };

        const validator = new BannedDependenciesValidator(config, graph);
        const result = await validator.validate();

        expect(result.valid).toBe(true);
    });

    it('should handle banned dependency without alternatives', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            bannedDependencies: [
                {
                    package: 'lodash',
                    reason: 'Use native',
                    // no alternatives
                },
            ],
        };

        const graph: DependencyGraph = {
            nodes: [
                {
                    id: 'src/types/index.ts',
                    filePath: path.join(projectRoot, 'src/types/index.ts'),
                    layer: 'types',
                },
            ],
            edges: [],
        };

        const validator = new BannedDependenciesValidator(config, graph);
        const result = await validator.validate();

        expect(result).toBeDefined();
    });

    it('should handle pattern without package', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            bannedDependencies: [
                {
                    pattern: 'src/domain/** -> src/infrastructure/**',
                    reason: 'Domain should not depend on infrastructure',
                },
            ],
        };

        const graph: DependencyGraph = {
            nodes: [
                {
                    id: 'src/types/index.ts',
                    filePath: path.join(projectRoot, 'src/types/index.ts'),
                    layer: 'types',
                },
            ],
            edges: [],
        };

        const validator = new BannedDependenciesValidator(config, graph);
        const result = await validator.validate();

        expect(result.valid).toBe(true);
    });

    it('should handle empty graph', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            bannedDependencies: [
                {
                    package: 'lodash',
                    reason: 'Use native',
                },
            ],
        };

        const graph: DependencyGraph = {
            nodes: [],
            edges: [],
        };

        const validator = new BannedDependenciesValidator(config, graph);
        const result = await validator.validate();

        expect(result.valid).toBe(true);
        expect(result.summary.filesAnalyzed).toBe(0);
    });

    it('should count filesAnalyzed correctly', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            bannedDependencies: [
                {
                    package: 'lodash',
                    reason: 'Use native',
                },
            ],
        };

        const graph: DependencyGraph = {
            nodes: [
                {
                    id: 'src/types/index.ts',
                    filePath: path.join(projectRoot, 'src/types/index.ts'),
                    layer: 'types',
                },
                {
                    id: 'src/config/loader.ts',
                    filePath: path.join(projectRoot, 'src/config/loader.ts'),
                    layer: 'config',
                },
            ],
            edges: [],
        };

        const validator = new BannedDependenciesValidator(config, graph);
        const result = await validator.validate();

        expect(result.summary.filesAnalyzed).toBe(2);
    });
});
