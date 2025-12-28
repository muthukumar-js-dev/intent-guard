// Mock chalk to avoid ESM import issues
jest.mock('chalk', () => ({
    default: {
        red: (str: string) => str,
        green: (str: string) => str,
        cyan: (str: string) => str,
        yellow: (str: string) => str,
        gray: (str: string) => str,
        bold: (str: string) => str,
        underline: (str: string) => str,
    },
    red: (str: string) => str,
    green: (str: string) => str,
    cyan: (str: string) => str,
    yellow: (str: string) => str,
    gray: (str: string) => str,
    bold: (str: string) => str,
    underline: (str: string) => str,
}));

import { ValidateCommand } from '../../../src/cli/commands/validate-command';
import { ConfigLoader } from '../../../src/config/loader';
import * as fs from 'fs';
import * as path from 'path';

describe('Validate Command - Integration Tests', () => {
    const testDir = path.join(__dirname, 'test-validate-integration');
    let mockExit: jest.SpyInstance;
    let originalCwd: string;

    beforeAll(() => {
        originalCwd = process.cwd();
    });

    beforeEach(() => {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
            try {
                fs.rmSync(testDir, { recursive: true, force: true });
            } catch (e) {
                // Ignore removal errors if any
            }
        }
        fs.mkdirSync(testDir, { recursive: true });

        // Create dummy package.json
        fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify({
            name: 'test-project',
            version: '1.0.0'
        }));

        // Create valid minimal config for all tests by default
        const configDir = path.join(testDir, '.intentguard');
        fs.mkdirSync(configDir, { recursive: true });

        const config = `version: "1.0.0"
architecture:
  layers:
    - name: shared
      path: src/shared/**
      canImportFrom: []
`;
        fs.writeFileSync(path.join(configDir, 'intent.config.yaml'), config);

        // Mock process.exit to avoid crashing tests
        mockExit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
            // console.log(`process.exit called with ${code}`);
            throw new Error(`process.exit: ${code}`);
        }) as any);
    });

    afterEach(() => {
        // Clear config cache to ensure clean state
        ConfigLoader.clearCache();

        // Always switch back to original CWD first
        try {
            if (process.cwd() !== originalCwd) {
                process.chdir(originalCwd);
            }
        } catch (e) {
            console.error('Failed to change CWD back:', e);
        }

        mockExit.mockRestore();

        // Then clean up
        if (fs.existsSync(testDir)) {
            try {
                fs.rmSync(testDir, { recursive: true, force: true });
            } catch (e) {
                // Ignore removal errors
            }
        }
        jest.restoreAllMocks();
    });

    it('should validate project with no violations', async () => {
        // Create a valid file structure
        const srcDir = path.join(testDir, 'src', 'shared');
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(path.join(srcDir, 'utils.ts'), 'export const noop = () => {};');

        process.chdir(testDir);

        const mockLog = jest.spyOn(console, 'log').mockImplementation();

        // Validate command should succeed
        const cmd = new ValidateCommand();
        try {
            await cmd.execute({ format: 'text' });
        } catch (e) {
            console.error('Error in no violations test:', e);
            throw e;
        }

        expect(mockLog).toHaveBeenCalled();
        // Verify success message
        const output = mockLog.mock.calls.map(call => call[0]).join('\n');
        expect(output).not.toContain('Violations found');
    });

    it('should output JSON format when requested', async () => {
        // Create a valid file structure
        const srcDir = path.join(testDir, 'src', 'shared');
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(path.join(srcDir, 'utils.ts'), 'export const noop = () => {};');

        process.chdir(testDir);

        const mockLog = jest.spyOn(console, 'log').mockImplementation();

        const cmd = new ValidateCommand();
        try {
            await cmd.execute({ format: 'json' });
        } catch (e) {
            console.error('Error in JSON format test:', e);
            throw e;
        }

        expect(mockLog).toHaveBeenCalled();
        const output = mockLog.mock.calls[0][0];

        // Should be valid JSON
        expect(() => JSON.parse(output)).not.toThrow();
        const result = JSON.parse(output);
        expect(result).toHaveProperty('valid');
        expect(result.valid).toBe(true);
        expect(result).toHaveProperty('violations');
        expect(result).toHaveProperty('summary');
    });

    it('should detect layer boundary violations', async () => {
        // Update config to have multiple layers with constraints
        const configDir = path.join(testDir, '.intentguard');
        const config = `version: "1.0.0"
architecture:
  layers:
    - name: domain
      path: src/domain/**
      canImportFrom: []
    - name: infrastructure
      path: src/infrastructure/**
      canImportFrom: [domain]
`;
        // We overwrite the existing config
        fs.writeFileSync(path.join(configDir, 'intent.config.yaml'), config);

        // Create file structure
        const srcDir = path.join(testDir, 'src');
        const domainDir = path.join(srcDir, 'domain');
        const infraDir = path.join(srcDir, 'infrastructure');

        fs.mkdirSync(domainDir, { recursive: true });
        fs.mkdirSync(infraDir, { recursive: true });

        // Create files with violation (domain importing infrastructure)
        fs.writeFileSync(
            path.join(domainDir, 'user.ts'),
            'import { db } from "../infrastructure/db";\nexport class User {}'
        );
        fs.writeFileSync(
            path.join(infraDir, 'db.ts'),
            'export const db = {};'
        );

        process.chdir(testDir);

        const mockLog = jest.spyOn(console, 'log').mockImplementation();

        const cmd = new ValidateCommand();

        // Manual execution without expectation wrapper to see result
        try {
            await cmd.execute({ format: 'json' });

            // If we are here, it means it didn't throw
            const calls = mockLog.mock.calls;
            const output = calls.length > 0 ? calls[0][0] : 'No output';
            console.log('DEBUG INTEGRATION: expected failure but passed. Output:', output);

            // Manually fail
            expect('should throw process.exit').toBe('did not throw');
        } catch (e: any) {
            if (e.message.includes('process.exit: 1')) {
                // This is what we expect!
            } else {
                // Unexpected error
                console.error('Unexpected error in test:', e);
                throw e;
            }
        }
    });

    it('should work with empty project', async () => {
        // Use minimal config (already set in beforeEach, but valid)
        // No source files in src/shared, but directory exists?
        // src/shared doesn't exist yet, should handle gracefully or warn

        process.chdir(testDir);

        const mockLog = jest.spyOn(console, 'log').mockImplementation();

        const cmd = new ValidateCommand();
        try {
            await cmd.execute({ format: 'text' });
        } catch (e) {
            console.error('Error in empty project test:', e);
            throw e;
        }

        expect(mockLog).toHaveBeenCalled();
        const output = mockLog.mock.calls.map(call => call[0]).join('\n');
        // It might say 0 files analyzed
        expect(output).toBeDefined();
    });
});
