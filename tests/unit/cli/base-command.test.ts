// Mock error-handler to avoid ESM import issues with chalk
jest.mock('../../../src/cli/error-handler', () => ({
    CLIError: class CLIError extends Error {
        constructor(message: string, public suggestion?: string, public exitCode: number = 1) {
            super(message);
            this.name = 'CLIError';
        }
    },
    ErrorHandler: {
        handle: jest.fn(),
        wrap: jest.fn(),
    },
}));

import { BaseCommand } from '../../../src/cli/commands/base-command';
import { ConfigLoader } from '../../../src/config';

class TestCommand extends BaseCommand {
    async execute(): Promise<void> {
        // Test implementation
    }
}

describe('BaseCommand', () => {
    it('should load config successfully', () => {
        const cmd = new TestCommand();

        // Mock ConfigLoader to avoid actual file system access
        jest.spyOn(ConfigLoader, 'load').mockReturnValue({
            version: '1.0.0',
            architecture: { layers: [] },
        });
        jest.spyOn(ConfigLoader, 'findProjectRoot').mockReturnValue('/test/root');

        expect(() => cmd['loadConfig']()).not.toThrow();
        expect(cmd['config']).toBeDefined();
        expect(cmd['projectRoot']).toBe('/test/root');
    });

    it('should throw CLIError on config not found', () => {
        const cmd = new TestCommand();

        jest.spyOn(ConfigLoader, 'load').mockImplementation(() => {
            throw new Error('Config file not found');
        });

        expect(() => cmd['loadConfig']()).toThrow('Configuration file not found');
    });

    it('should use process.cwd() if projectRoot is null', () => {
        const cmd = new TestCommand();

        jest.spyOn(ConfigLoader, 'load').mockReturnValue({
            version: '1.0.0',
            architecture: { layers: [] },
        });
        jest.spyOn(ConfigLoader, 'findProjectRoot').mockReturnValue(null);

        cmd['loadConfig']();
        expect(cmd['projectRoot']).toBe(process.cwd());
    });
});
