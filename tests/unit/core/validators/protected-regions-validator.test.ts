import { ProtectedRegionsValidator } from '../../../../src/core/validators/protected-regions-validator';
import type { IntentGuardConfig } from '../../../../src/types';
import * as path from 'path';

describe('ProtectedRegionsValidator', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');

    const testConfig: IntentGuardConfig = {
        version: '1.0.0',
        architecture: {
            layers: [],
        },
        protectedRegions: [
            {
                path: 'src/types/index.ts',
                reason: 'Core type definitions - changes require architecture review',
                aiMutable: false,
            },
            {
                path: 'src/config/schema.ts',
                reason: 'Configuration schema - changes require validation',
                aiMutable: false,
            },
            {
                path: 'tests/**/*.test.ts',
                reason: 'Test files can be modified by AI',
                aiMutable: true,
            },
        ],
    };

    it('should pass when no files are changed', async () => {
        const validator = new ProtectedRegionsValidator(testConfig, projectRoot);
        const result = await validator.validate([]);

        expect(result.valid).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    it('should detect modifications to protected regions', async () => {
        const validator = new ProtectedRegionsValidator(testConfig, projectRoot);
        const changedFiles = [path.join(projectRoot, 'src/types/index.ts')];
        const result = await validator.validate(changedFiles);

        expect(result.valid).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.violations[0].ruleId).toBe('protected-region');
        expect(result.violations[0].severity).toBe('error');
    });

    it('should skip aiMutable regions', async () => {
        const validator = new ProtectedRegionsValidator(testConfig, projectRoot);
        const changedFiles = [path.join(projectRoot, 'tests/unit/config/loader.test.ts')];
        const result = await validator.validate(changedFiles);

        // Test files are aiMutable: true, so should pass
        expect(result.valid).toBe(true);
    });

    it('should provide helpful error messages', async () => {
        const validator = new ProtectedRegionsValidator(testConfig, projectRoot);
        const changedFiles = [path.join(projectRoot, 'src/config/schema.ts')];
        const result = await validator.validate(changedFiles);

        expect(result.violations[0].message).toContain('Protected region');
        expect(result.violations[0].message).toContain('Configuration schema');
        expect(result.violations[0].suggestion).toBeDefined();
        expect(result.violations[0].suggestion).toContain('cannot be modified');
    });

    it('should handle empty protected regions', async () => {
        const emptyConfig: IntentGuardConfig = {
            version: '1.0.0',
            architecture: {
                layers: [],
            },
            protectedRegions: [],
        };

        const validator = new ProtectedRegionsValidator(emptyConfig, projectRoot);
        const result = await validator.validate(['any-file.ts']);

        expect(result.valid).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    it('should handle undefined protected regions', async () => {
        const noRegionsConfig: IntentGuardConfig = {
            version: '1.0.0',
            architecture: {
                layers: [],
            },
        };

        const validator = new ProtectedRegionsValidator(noRegionsConfig, projectRoot);
        const result = await validator.validate(['any-file.ts']);

        expect(result.valid).toBe(true);
    });

    it('should count errors correctly', async () => {
        const validator = new ProtectedRegionsValidator(testConfig, projectRoot);
        const changedFiles = [
            path.join(projectRoot, 'src/types/index.ts'),
            path.join(projectRoot, 'src/config/schema.ts'),
        ];
        const result = await validator.validate(changedFiles);

        expect(result.summary.errors).toBeGreaterThan(0);
        expect(result.summary.filesAnalyzed).toBe(2);
    });
});
