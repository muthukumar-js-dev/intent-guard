import { ConfigLoader } from '../../../src/config/loader';
import * as path from 'path';

describe('ConfigLoader', () => {
    const fixturesDir = path.join(__dirname, '../../fixtures/configs');

    describe('loadFromFile', () => {
        it('should load valid config file', () => {
            const configPath = path.join(fixturesDir, 'valid-config.yaml');
            const config = ConfigLoader.loadFromFile(configPath);

            expect(config).toBeDefined();
            expect(config.version).toBe('1.0.0');
            expect(config.architecture.layers).toHaveLength(3);
            expect(config.architecture.layers[0].name).toBe('presentation');
        });

        it('should throw error for invalid YAML syntax', () => {
            const configPath = path.join(fixturesDir, 'invalid-yaml.yaml');

            expect(() => ConfigLoader.loadFromFile(configPath)).toThrow(
                /Failed to parse YAML configuration/
            );
        });

        it('should throw error for missing required fields', () => {
            const configPath = path.join(fixturesDir, 'missing-required.yaml');

            expect(() => ConfigLoader.loadFromFile(configPath)).toThrow(
                /Missing required field/
            );
        });

        it('should throw error for duplicate layer names', () => {
            const configPath = path.join(fixturesDir, 'duplicate-layers.yaml');

            expect(() => ConfigLoader.loadFromFile(configPath)).toThrow(
                /Duplicate layer names found/
            );
        });

        it('should throw error for circular dependencies', () => {
            const configPath = path.join(fixturesDir, 'circular-deps.yaml');

            expect(() => ConfigLoader.loadFromFile(configPath)).toThrow(
                /Circular dependency detected/
            );
        });

        it('should throw error for invalid layer references', () => {
            const configPath = path.join(fixturesDir, 'invalid-references.yaml');

            expect(() => ConfigLoader.loadFromFile(configPath)).toThrow(
                /references unknown layer/
            );
        });

        it('should merge with default values', () => {
            const configPath = path.join(fixturesDir, 'valid-config.yaml');
            const config = ConfigLoader.loadFromFile(configPath);

            // Should have defaults for optional fields
            expect(config.intents).toBeDefined();
            expect(Array.isArray(config.intents)).toBe(true);
        });
    });

    describe('findProjectRoot', () => {
        it('should find project root from current directory', () => {
            const root = ConfigLoader.findProjectRoot();

            expect(root).toBeDefined();
            expect(root).toContain('intent-guard');
        });

        it('should return null if config not found', () => {
            const root = ConfigLoader.findProjectRoot('/nonexistent/path');

            expect(root).toBeNull();
        });
    });

    describe('load', () => {
        it('should load config from current directory', () => {
            const config = ConfigLoader.load();

            expect(config).toBeDefined();
            expect(config.architecture).toBeDefined();
            expect(config.architecture.layers).toBeDefined();
        });

        it('should throw error if config not found', () => {
            expect(() => ConfigLoader.load('/nonexistent/path')).toThrow(
                /Configuration file not found/
            );
        });
    });
});
