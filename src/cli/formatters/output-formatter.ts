import chalk from 'chalk';
import type { ValidationResult, Violation } from '../../types';

export class OutputFormatter {
    /**
     * Format validation result as JSON
     */
    static formatJSON(result: ValidationResult): string {
        return JSON.stringify(result, null, 2);
    }

    /**
     * Format validation result as human-readable text
     */
    static formatText(result: ValidationResult): string {
        const lines: string[] = [];

        lines.push(chalk.bold('\n🔍 Intent-Guard Validation Report\n'));

        if (result.violations.length === 0) {
            lines.push(chalk.green('✅ No violations found!'));
            lines.push(chalk.gray(`   Analyzed ${result.summary.filesAnalyzed} files\n`));
            return lines.join('\n');
        }

        // Group violations by file
        const violationsByFile = new Map<string, Violation[]>();
        for (const violation of result.violations) {
            if (!violationsByFile.has(violation.file)) {
                violationsByFile.set(violation.file, []);
            }
            violationsByFile.get(violation.file)!.push(violation);
        }

        // Output violations
        for (const [file, fileViolations] of violationsByFile) {
            lines.push(chalk.underline(file));
            for (const violation of fileViolations) {
                lines.push(this.formatViolation(violation, file));
            }
            lines.push('');
        }

        // Summary
        lines.push(chalk.bold('Summary:'));
        if (result.summary.errors > 0) {
            lines.push(chalk.red(`  ❌ ${result.summary.errors} error(s)`));
        }
        if (result.summary.warnings > 0) {
            lines.push(chalk.yellow(`  ⚠️  ${result.summary.warnings} warning(s)`));
        }
        lines.push(chalk.gray(`  📁 ${result.summary.filesAnalyzed} file(s) analyzed\n`));

        return lines.join('\n');
    }

    /**
     * Format individual violation with icons and colors
     */
    static formatViolation(violation: Violation, file: string): string {
        const lines: string[] = [];
        const icon = violation.severity === 'error' ? '❌' : '⚠️';
        const color = violation.severity === 'error' ? chalk.red : chalk.yellow;
        const location = violation.line ? `:${violation.line}` : '';

        lines.push(
            `  ${icon} ${color(violation.message)} ${chalk.gray(`[${violation.ruleId}]`)}`
        );

        if (location) {
            lines.push(chalk.gray(`     at ${file}${location}`));
        }

        if (violation.suggestion) {
            lines.push(chalk.cyan(`     💡 ${violation.suggestion}`));
        }

        return lines.join('\n');
    }
}
