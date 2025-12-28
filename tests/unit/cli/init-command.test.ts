import * as fs from 'fs';
import * as path from 'path';

// Mock chalk to avoid ESM import issues
jest.mock('chalk', () => ({
    default: {
        green: (str: string) => str,
        cyan: (str: string) => str,
        yellow: (str: string) => str,
        gray: (str: string) => str,
    },
    green: (str: string) => str,
    cyan: (str: string) => str,
    yellow: (str: string) => str,
    gray: (str: string) => str,
}));

import { InitCommand } from '../../../src/cli/commands/init-command';

describe('InitCommand', () => {
    const testDir = path.join(__dirname, 'test-init');

    beforeEach(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true });
        }
        fs.mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true });
        }
    });

    it('should create config directory and files', async () => {
        const originalCwd = process.cwd();
        process.chdir(testDir);

        const cmd = new InitCommand();
        await cmd.execute();

        const configPath = path.join(testDir, '.intentguard', 'intent.config.yaml');
        expect(fs.existsSync(configPath)).toBe(true);

        process.chdir(originalCwd);
    });

    it('should not overwrite existing config', async () => {
        const originalCwd = process.cwd();
        process.chdir(testDir);

        const cmd = new InitCommand();

        await cmd.execute();
        const firstRun = fs.readFileSync(
            path.join(testDir, '.intentguard', 'intent.config.yaml'),
            'utf-8'
        );

        await cmd.execute();
        const secondRun = fs.readFileSync(
            path.join(testDir, '.intentguard', 'intent.config.yaml'),
            'utf-8'
        );

        expect(firstRun).toBe(secondRun);

        process.chdir(originalCwd);
    });

    it('should create .gitignore file', async () => {
        const originalCwd = process.cwd();
        process.chdir(testDir);

        const cmd = new InitCommand();
        await cmd.execute();

        const gitignorePath = path.join(testDir, '.intentguard', '.gitignore');
        expect(fs.existsSync(gitignorePath)).toBe(true);
        expect(fs.readFileSync(gitignorePath, 'utf-8')).toContain('memory.json');

        process.chdir(originalCwd);
    });

    it('should create valid YAML config', async () => {
        const originalCwd = process.cwd();
        process.chdir(testDir);

        const cmd = new InitCommand();
        await cmd.execute();

        const configPath = path.join(testDir, '.intentguard', 'intent.config.yaml');
        const configContent = fs.readFileSync(configPath, 'utf-8');

        expect(configContent).toContain('version:');
        expect(configContent).toContain('architecture:');
        expect(configContent).toContain('layers:');
        expect(configContent).toContain('presentation');
        expect(configContent).toContain('domain');
        expect(configContent).toContain('infrastructure');

        process.chdir(originalCwd);
    });
});
