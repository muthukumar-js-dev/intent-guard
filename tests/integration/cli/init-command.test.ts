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

import { InitCommand } from '../../../src/cli/commands/init-command';
import * as fs from 'fs';
import * as path from 'path';

describe('Init Command - Integration Tests', () => {
    const testDir = path.join(__dirname, 'test-init-integration');
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
                // Ignore
            }
        }
        fs.mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
        // Restore CWD
        process.chdir(originalCwd);

        // Clean up after tests
        if (fs.existsSync(testDir)) {
            try {
                fs.rmSync(testDir, { recursive: true, force: true });
            } catch (e) {
                // Ignore
            }
        }
    });

    it('should create complete project structure', async () => {
        process.chdir(testDir);

        const cmd = new InitCommand();
        await cmd.execute();

        // Verify .intentguard directory exists
        const intentguardDir = path.join(testDir, '.intentguard');
        expect(fs.existsSync(intentguardDir)).toBe(true);

        // Verify intent.config.yaml exists and has content
        const configFile = path.join(intentguardDir, 'intent.config.yaml');
        expect(fs.existsSync(configFile)).toBe(true);

        const configContent = fs.readFileSync(configFile, 'utf-8');
        expect(configContent).toContain('version:');
        expect(configContent).toContain('architecture:');
        expect(configContent).toContain('layers:');

        // Verify .gitignore exists
        const gitignoreFile = path.join(intentguardDir, '.gitignore');
        expect(fs.existsSync(gitignoreFile)).toBe(true);
    });

    it('should not overwrite existing configuration', async () => {
        process.chdir(testDir);

        const cmd = new InitCommand();

        // First init
        await cmd.execute();
        const configFile = path.join(testDir, '.intentguard', 'intent.config.yaml');
        const firstContent = fs.readFileSync(configFile, 'utf-8');

        // Modify the config
        fs.writeFileSync(configFile, firstContent + '\n# Modified');

        // Second init should not overwrite
        await cmd.execute();
        const secondContent = fs.readFileSync(configFile, 'utf-8');

        expect(secondContent).toContain('# Modified');
        expect(secondContent).toBe(firstContent + '\n# Modified');
    });

    it('should create valid YAML that can be parsed', async () => {
        process.chdir(testDir);

        const cmd = new InitCommand();
        await cmd.execute();

        const configFile = path.join(testDir, '.intentguard', 'intent.config.yaml');
        const configContent = fs.readFileSync(configFile, 'utf-8');

        // Basic YAML validation
        expect(configContent).toMatch(/version:\s*"1\.0\.0"/);
        expect(configContent).toMatch(/architecture:/);
    });

    it('should work in nested directories', async () => {
        const nestedDir = path.join(testDir, 'nested', 'deep', 'path');
        fs.mkdirSync(nestedDir, { recursive: true });

        process.chdir(nestedDir);

        const cmd = new InitCommand();
        await cmd.execute();

        // Config should be created in the current directory
        const configFile = path.join(nestedDir, '.intentguard', 'intent.config.yaml');
        expect(fs.existsSync(configFile)).toBe(true);
    });
});
