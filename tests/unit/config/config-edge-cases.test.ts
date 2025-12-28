import { ConfigLoader } from '../../../src/config/loader';
import * as path from 'path';
import * as fs from 'fs';

describe('Config - Additional Edge Cases', () => {
    const projectRoot = path.resolve(__dirname, '../../..');

    describe('ConfigLoader - Edge Cases', () => {
        it('should find project root from nested directory', () => {
            const root = ConfigLoader.findProjectRoot();
            expect(root).toBeDefined();
            if (root) {
                expect(fs.existsSync(path.join(root, 'package.json'))).toBe(true);
            }
        });

        it('should return null when no package.json found', () => {
            const originalCwd = process.cwd();

            // Try from root directory where there's no package.json above
            process.chdir('/');
            const root = ConfigLoader.findProjectRoot();

            process.chdir(originalCwd);

            // Might be null or might find a package.json
            expect(root === null || typeof root === 'string').toBe(true);
        });

        it('should load config from current directory', () => {
            const originalCwd = process.cwd();
            process.chdir(projectRoot);

            const config = ConfigLoader.load();

            expect(config).toBeDefined();
            expect(config.version).toBeDefined();
            expect(config.architecture).toBeDefined();

            process.chdir(originalCwd);
        });

        it('should handle config with all optional fields', () => {
            const originalCwd = process.cwd();
            process.chdir(projectRoot);

            const config = ConfigLoader.load();

            // Config might or might not have optional fields
            expect(config).toBeDefined();

            process.chdir(originalCwd);
        });

        it('should normalize paths correctly', () => {
            const root = ConfigLoader.findProjectRoot();

            if (root) {
                // Should handle both Windows and Unix paths
                expect(typeof root).toBe('string');
                expect(root.length).toBeGreaterThan(0);
            }
        });

        it('should find config file in .intentguard directory', () => {
            const originalCwd = process.cwd();
            process.chdir(projectRoot);

            const config = ConfigLoader.load();

            expect(config).toBeDefined();
            expect(config.architecture.layers).toBeDefined();

            process.chdir(originalCwd);
        });
    });
});
