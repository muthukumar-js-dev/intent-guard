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
import { ConfigLoader } from '../../../src/config';
import { DependencyGraphBuilder } from '../../../src/core/graph';
import {
    LayerBoundaryValidator,
    ProtectedRegionsValidator,
    BannedDependenciesValidator,
} from '../../../src/core/validators';

describe('ValidateCommand', () => {
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

    it('should run all validators and output text format', async () => {
        const cmd = new ValidateCommand();

        jest.spyOn(ConfigLoader, 'load').mockReturnValue({
            version: '1.0.0',
            architecture: { layers: [] },
        });
        jest.spyOn(ConfigLoader, 'findProjectRoot').mockReturnValue('/test');

        jest.spyOn(DependencyGraphBuilder.prototype, 'build').mockResolvedValue({
            nodes: [],
            edges: [],
        });

        jest.spyOn(LayerBoundaryValidator.prototype, 'validate').mockReturnValue({
            valid: true,
            violations: [],
            summary: { errors: 0, warnings: 0, filesAnalyzed: 0 },
        });

        jest.spyOn(ProtectedRegionsValidator.prototype, 'validate').mockResolvedValue({
            valid: true,
            violations: [],
            summary: { errors: 0, warnings: 0, filesAnalyzed: 0 },
        });

        jest.spyOn(BannedDependenciesValidator.prototype, 'validate').mockResolvedValue({
            valid: true,
            violations: [],
            summary: { errors: 0, warnings: 0, filesAnalyzed: 0 },
        });

        await cmd.execute({ format: 'text' });

        expect(mockLog).toHaveBeenCalled();
    });

    it('should output JSON format when requested', async () => {
        const cmd = new ValidateCommand();

        jest.spyOn(ConfigLoader, 'load').mockReturnValue({
            version: '1.0.0',
            architecture: { layers: [] },
        });
        jest.spyOn(ConfigLoader, 'findProjectRoot').mockReturnValue('/test');

        jest.spyOn(DependencyGraphBuilder.prototype, 'build').mockResolvedValue({
            nodes: [],
            edges: [],
        });

        jest.spyOn(LayerBoundaryValidator.prototype, 'validate').mockReturnValue({
            valid: true,
            violations: [],
            summary: { errors: 0, warnings: 0, filesAnalyzed: 0 },
        });

        jest.spyOn(ProtectedRegionsValidator.prototype, 'validate').mockResolvedValue({
            valid: true,
            violations: [],
            summary: { errors: 0, warnings: 0, filesAnalyzed: 0 },
        });

        jest.spyOn(BannedDependenciesValidator.prototype, 'validate').mockResolvedValue({
            valid: true,
            violations: [],
            summary: { errors: 0, warnings: 0, filesAnalyzed: 0 },
        });

        await cmd.execute({ format: 'json' });

        const output = mockLog.mock.calls[0][0];
        expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should exit with code 1 when errors are found', async () => {
        const cmd = new ValidateCommand();

        jest.spyOn(ConfigLoader, 'load').mockReturnValue({
            version: '1.0.0',
            architecture: { layers: [] },
        });
        jest.spyOn(ConfigLoader, 'findProjectRoot').mockReturnValue('/test');

        jest.spyOn(DependencyGraphBuilder.prototype, 'build').mockResolvedValue({
            nodes: [],
            edges: [],
        });

        jest.spyOn(LayerBoundaryValidator.prototype, 'validate').mockReturnValue({
            valid: false,
            violations: [
                {
                    ruleId: 'test',
                    severity: 'error',
                    file: 'test.ts',
                    message: 'Test error',
                    autoFixable: false,
                },
            ],
            summary: { errors: 1, warnings: 0, filesAnalyzed: 1 },
        });

        jest.spyOn(ProtectedRegionsValidator.prototype, 'validate').mockResolvedValue({
            valid: true,
            violations: [],
            summary: { errors: 0, warnings: 0, filesAnalyzed: 0 },
        });

        jest.spyOn(BannedDependenciesValidator.prototype, 'validate').mockResolvedValue({
            valid: true,
            violations: [],
            summary: { errors: 0, warnings: 0, filesAnalyzed: 0 },
        });

        await expect(cmd.execute({ format: 'text' })).rejects.toThrow('process.exit: 1');
    });
});
