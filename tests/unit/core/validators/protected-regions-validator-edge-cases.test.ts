import { ProtectedRegionsValidator } from '../../../../src/core/validators/protected-regions-validator';
import type { IntentGuardConfig } from '../../../../src/types';
import * as path from 'path';

describe('ProtectedRegionsValidator - Edge Cases', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');

    it('should handle undefined protectedRegions', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            // protectedRegions is undefined
        };

        const validator = new ProtectedRegionsValidator(config, projectRoot);
        const result = await validator.validate(['any-file.ts']);

        expect(result.valid).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    it('should handle empty protectedRegions array', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            protectedRegions: [],
        };

        const validator = new ProtectedRegionsValidator(config, projectRoot);
        const result = await validator.validate(['any-file.ts']);

        expect(result.valid).toBe(true);
    });

    it('should skip aiMutable regions', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            protectedRegions: [
                {
                    path: 'tests/**',
                    reason: 'Test files',
                    aiMutable: true,
                },
            ],
        };

        const validator = new ProtectedRegionsValidator(config, projectRoot);
        const changedFiles = [path.join(projectRoot, 'tests/unit/test.ts')];
        const result = await validator.validate(changedFiles);

        expect(result.valid).toBe(true);
    });

    it('should handle no changedFiles provided', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            protectedRegions: [
                {
                    path: 'src/types/**',
                    reason: 'Core types',
                    aiMutable: false,
                },
            ],
        };

        const validator = new ProtectedRegionsValidator(config, projectRoot);
        const result = await validator.validate();

        // Should create warnings (not errors) for all protected files
        expect(result.valid).toBe(true); // No errors, only warnings
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.violations.every(v => v.severity === 'warning')).toBe(true);
        expect(result.summary.warnings).toBeGreaterThan(0);
        expect(result.summary.errors).toBe(0);
    });

    it('should handle files not in changedFiles list', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            protectedRegions: [
                {
                    path: 'src/types/**',
                    reason: 'Core types',
                    aiMutable: false,
                },
            ],
        };

        const validator = new ProtectedRegionsValidator(config, projectRoot);
        const changedFiles = [path.join(projectRoot, 'src/config/loader.ts')];
        const result = await validator.validate(changedFiles);

        expect(result.valid).toBe(true);
    });

    it('should handle glob patterns with **', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            protectedRegions: [
                {
                    path: 'src/**/types/**',
                    reason: 'Nested types',
                    aiMutable: false,
                },
            ],
        };

        const validator = new ProtectedRegionsValidator(config, projectRoot);
        const result = await validator.validate();

        expect(result).toBeDefined();
    });

    it('should count filesAnalyzed correctly', async () => {
        const config: IntentGuardConfig = {
            version: '1.0.0',
            architecture: { layers: [] },
            protectedRegions: [
                {
                    path: 'src/types/**',
                    reason: 'Core types',
                    aiMutable: false,
                },
            ],
        };

        const validator = new ProtectedRegionsValidator(config, projectRoot);
        const changedFiles = [
            path.join(projectRoot, 'src/types/index.ts'),
            path.join(projectRoot, 'src/config/loader.ts'),
        ];
        const result = await validator.validate(changedFiles);

        expect(result.summary.filesAnalyzed).toBe(2);
    });
});
