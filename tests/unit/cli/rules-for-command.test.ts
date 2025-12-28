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

import { RulesForCommand } from '../../../src/cli/commands/rules-for-command';
import { ConfigLoader } from '../../../src/config';
import * as path from 'path';

describe('RulesForCommand', () => {
    const projectRoot = path.resolve(__dirname, '../../../');

    let mockExit: jest.SpyInstance;
    let mockLog: jest.SpyInstance;

    beforeEach(() => {
        mockExit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
            throw new Error(`process.exit: ${code}`);
        }) as any);
        mockLog = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        mockExit.mockRestore();
        mockLog.mockRestore();
    });

    it('should return rules for a file in a layer', async () => {
        const cmd = new RulesForCommand();

        jest.spyOn(ConfigLoader, 'load').mockReturnValue({
            version: '1.0.0',
            architecture: {
                layers: [
                    {
                        name: 'domain',
                        path: 'src/domain/**',
                        canImportFrom: [],
                    },
                ],
            },
        });
        jest.spyOn(ConfigLoader, 'findProjectRoot').mockReturnValue(projectRoot);

        await cmd.execute('src/domain/user.ts');

        expect(mockLog).toHaveBeenCalled();
        const output = JSON.parse(mockLog.mock.calls[0][0]);
        expect(output.layer).toBe('domain');
        expect(output.canImportFrom).toEqual([]);
    });

    it('should handle files not in any layer', async () => {
        const cmd = new RulesForCommand();

        jest.spyOn(ConfigLoader, 'load').mockReturnValue({
            version: '1.0.0',
            architecture: {
                layers: [
                    {
                        name: 'domain',
                        path: 'src/domain/**',
                        canImportFrom: [],
                    },
                ],
            },
        });
        jest.spyOn(ConfigLoader, 'findProjectRoot').mockReturnValue(projectRoot);

        await cmd.execute('src/other/file.ts');

        const output = JSON.parse(mockLog.mock.calls[0][0]);
        expect(output.layer).toBeUndefined();
    });

    it('should detect protected regions', async () => {
        const cmd = new RulesForCommand();

        jest.spyOn(ConfigLoader, 'load').mockReturnValue({
            version: '1.0.0',
            architecture: { layers: [] },
            protectedRegions: [
                {
                    path: 'src/types/**',
                    reason: 'Core types',
                    aiMutable: false,
                },
            ],
        });
        jest.spyOn(ConfigLoader, 'findProjectRoot').mockReturnValue(projectRoot);

        await cmd.execute('src/types/index.ts');

        const output = JSON.parse(mockLog.mock.calls[0][0]);
        expect(output.isProtected).toBe(true);
        expect(output.protectedReason).toBe('Core types');
    });

    it('should include banned dependencies', async () => {
        const cmd = new RulesForCommand();

        jest.spyOn(ConfigLoader, 'load').mockReturnValue({
            version: '1.0.0',
            architecture: { layers: [] },
            bannedDependencies: [
                {
                    package: 'lodash',
                    reason: 'Use native methods',
                    alternatives: ['ES6+'],
                },
            ],
        });
        jest.spyOn(ConfigLoader, 'findProjectRoot').mockReturnValue(projectRoot);

        await cmd.execute('src/app.ts');

        const output = JSON.parse(mockLog.mock.calls[0][0]);
        expect(output.bannedDependencies).toHaveLength(1);
        expect(output.bannedDependencies[0].package).toBe('lodash');
    });
});
