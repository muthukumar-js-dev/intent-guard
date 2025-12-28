import { BannedDependenciesValidator } from '../../../../src/core/validators/banned-dependencies-validator';
import type { IntentGuardConfig, DependencyGraph } from '../../../../src/types';
import * as path from 'path';

describe('BannedDependenciesValidator', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');

    const testConfig: IntentGuardConfig = {
        version: '1.0.0',
        architecture: {
            layers: [],
        },
        bannedDependencies: [
            {
                package: 'lodash',
                reason: 'Use native JavaScript methods instead',
                alternatives: ['native Array methods', 'ES6+ features'],
            },
            {
                package: 'moment',
                reason: 'Too large, use modern alternatives',
                alternatives: ['date-fns', 'dayjs'],
            },
        ],
    };

    it('should pass when no banned dependencies are used', async () => {
        // Use actual project file
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

        const validator = new BannedDependenciesValidator(testConfig, graph);
        const result = await validator.validate();

        expect(result.valid).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    it('should handle empty banned dependencies', async () => {
        const emptyConfig: IntentGuardConfig = {
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

        const validator = new BannedDependenciesValidator(emptyConfig, graph);
        const result = await validator.validate();

        expect(result.valid).toBe(true);
    });

    it('should handle undefined banned dependencies', async () => {
        const noConfig: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
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

        const validator = new BannedDependenciesValidator(noConfig, graph);
        const result = await validator.validate();

        expect(result.valid).toBe(true);
    });

    it('should count files analyzed correctly', async () => {
        const graph: DependencyGraph = {
            nodes: [
                {
                    id: 'src/types/index.ts',
                    filePath: path.join(projectRoot, 'src/types/index.ts'),
                    layer: 'types',
                },
                {
                    id: 'src/config/schema.ts',
                    filePath: path.join(projectRoot, 'src/config/schema.ts'),
                    layer: 'config',
                },
            ],
            edges: [],
        };

        const validator = new BannedDependenciesValidator(testConfig, graph);
        const result = await validator.validate();

        expect(result.summary.filesAnalyzed).toBe(2);
    });
});
