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

import { OutputFormatter } from '../../../src/cli/formatters/output-formatter';
import type { ValidationResult, Violation } from '../../../src/types';

describe('OutputFormatter', () => {
    describe('formatJSON', () => {
        it('should format validation result as JSON', () => {
            const result: ValidationResult = {
                valid: true,
                violations: [],
                summary: { errors: 0, warnings: 0, filesAnalyzed: 5 },
            };

            const output = OutputFormatter.formatJSON(result);
            const parsed = JSON.parse(output);

            expect(parsed.valid).toBe(true);
            expect(parsed.violations).toEqual([]);
            expect(parsed.summary.filesAnalyzed).toBe(5);
        });

        it('should format violations in JSON', () => {
            const result: ValidationResult = {
                valid: false,
                violations: [
                    {
                        ruleId: 'test-rule',
                        severity: 'error',
                        file: 'test.ts',
                        line: 10,
                        message: 'Test error',
                        suggestion: 'Fix it',
                        autoFixable: false,
                    },
                ],
                summary: { errors: 1, warnings: 0, filesAnalyzed: 1 },
            };

            const output = OutputFormatter.formatJSON(result);
            const parsed = JSON.parse(output);

            expect(parsed.violations).toHaveLength(1);
            expect(parsed.violations[0].ruleId).toBe('test-rule');
        });
    });

    describe('formatText', () => {
        it('should format success message', () => {
            const result: ValidationResult = {
                valid: true,
                violations: [],
                summary: { errors: 0, warnings: 0, filesAnalyzed: 5 },
            };

            const output = OutputFormatter.formatText(result);

            expect(output).toContain('No violations found');
            expect(output).toContain('5 files');
        });

        it('should format violations with errors', () => {
            const result: ValidationResult = {
                valid: false,
                violations: [
                    {
                        ruleId: 'test-rule',
                        severity: 'error',
                        file: 'test.ts',
                        line: 10,
                        message: 'Test error',
                        autoFixable: false,
                    },
                ],
                summary: { errors: 1, warnings: 0, filesAnalyzed: 1 },
            };

            const output = OutputFormatter.formatText(result);

            expect(output).toContain('test.ts');
            expect(output).toContain('Test error');
            expect(output).toContain('1 error');
        });

        it('should format violations with warnings', () => {
            const result: ValidationResult = {
                valid: true,
                violations: [
                    {
                        ruleId: 'test-rule',
                        severity: 'warning',
                        file: 'test.ts',
                        message: 'Test warning',
                        autoFixable: false,
                    },
                ],
                summary: { errors: 0, warnings: 1, filesAnalyzed: 1 },
            };

            const output = OutputFormatter.formatText(result);

            expect(output).toContain('Test warning');
            expect(output).toContain('1 warning');
        });
    });

    describe('formatViolation', () => {
        it('should format error violation', () => {
            const violation: Violation = {
                ruleId: 'test-rule',
                severity: 'error',
                file: 'test.ts',
                line: 10,
                message: 'Test error',
                autoFixable: false,
            };

            const output = OutputFormatter.formatViolation(violation, 'test.ts');

            expect(output).toContain('Test error');
            expect(output).toContain('test-rule');
            expect(output).toContain(':10');
        });

        it('should format warning violation', () => {
            const violation: Violation = {
                ruleId: 'test-rule',
                severity: 'warning',
                file: 'test.ts',
                message: 'Test warning',
                autoFixable: false,
            };

            const output = OutputFormatter.formatViolation(violation, 'test.ts');

            expect(output).toContain('Test warning');
        });

        it('should include suggestion when provided', () => {
            const violation: Violation = {
                ruleId: 'test-rule',
                severity: 'error',
                file: 'test.ts',
                message: 'Test error',
                suggestion: 'Fix this way',
                autoFixable: false,
            };

            const output = OutputFormatter.formatViolation(violation, 'test.ts');

            expect(output).toContain('Fix this way');
        });
    });
});
