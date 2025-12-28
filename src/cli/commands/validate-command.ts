import chalk from 'chalk';
import { BaseCommand } from './base-command';
import { DependencyGraphBuilder } from '../../core/graph';
import { FileCache } from '../../core/cache/file-cache';
import { MemoryManager } from '../../core/memory/memory-manager';
import {
    LayerBoundaryValidator,
    ProtectedRegionsValidator,
    BannedDependenciesValidator,
} from '../../core/validators';
import { OutputFormatter } from '../formatters';
import { GitUtils } from '../../utils/git';
import { CLIError } from '../error-handler';
import type { ValidationResult, Violation, DependencyGraph } from '../../types';

interface ValidateOptions {
    format?: 'json' | 'text';
    diff?: boolean;
    baseline?: boolean;
}

export class ValidateCommand extends BaseCommand {
    async execute(options: ValidateOptions = {}): Promise<void> {
        const format = options.format || 'text';

        // Load config
        this.loadConfig();

        if (!this.config || !this.projectRoot) {
            console.error(chalk.red('Failed to load configuration'));
            process.exit(1);
        }

        // Determine which files to analyze
        let changedFiles: string[] | undefined;

        if (options.diff) {
            // Check if git repository
            if (!GitUtils.isGitRepository(this.projectRoot)) {
                throw new CLIError(
                    '--diff mode requires a git repository',
                    'Initialize git with: git init'
                );
            }

            // Get changed files
            try {
                changedFiles = GitUtils.getChangedFiles(this.projectRoot);

                if (changedFiles.length === 0) {
                    console.log(chalk.green('✓ No changed files to validate'));
                    return;
                }

                console.log(chalk.blue(`Analyzing ${changedFiles.length} changed file(s)...`));
            } catch (error) {
                throw new CLIError(
                    'Failed to get changed files from git',
                    'Ensure git is installed and working directory is accessible'
                );
            }
        }

        // Initialize and load cache
        const cache = new FileCache(this.projectRoot);
        await cache.load();

        // Build dependency graph
        const graphBuilder = new DependencyGraphBuilder(this.config, this.projectRoot, cache);
        let graph: DependencyGraph;

        if (options.diff && changedFiles) {
            // Use optimized buildForFiles for --diff mode (50-100x faster)
            graph = await graphBuilder.buildForFiles(changedFiles);
        } else {
            // Build full graph for entire codebase
            graph = await graphBuilder.build();
        }

        // Save cache updates
        await cache.save();

        // Run all validators
        const results: ValidationResult[] = [];

        // 1. Layer Boundary Validator
        const layerValidator = new LayerBoundaryValidator(this.config, graph, this.projectRoot);
        results.push(layerValidator.validate());

        // 2. Protected Regions Validator (pass changedFiles if in diff mode)
        const protectedValidator = new ProtectedRegionsValidator(this.config, this.projectRoot);
        results.push(await protectedValidator.validate(changedFiles));

        // 3. Banned Dependencies Validator
        const bannedValidator = new BannedDependenciesValidator(this.config, graph);
        results.push(await bannedValidator.validate());

        // Aggregate results
        const allViolations: Violation[] = [];
        let totalErrors = 0;
        let totalWarnings = 0;
        let totalFilesAnalyzed = 0;

        for (const result of results) {
            allViolations.push(...result.violations);
            totalErrors += result.summary.errors;
            totalWarnings += result.summary.warnings;
            totalFilesAnalyzed = Math.max(totalFilesAnalyzed, result.summary.filesAnalyzed);
        }

        // Create validation result
        const validationResult: ValidationResult = {
            valid: totalErrors === 0,
            violations: allViolations,
            summary: {
                errors: totalErrors,
                warnings: totalWarnings,
                filesAnalyzed: totalFilesAnalyzed,
            },
        };

        // Architectural Memory Check
        const memoryManager = new MemoryManager(this.projectRoot);
        let memory = memoryManager.load();

        if (options.baseline) {
            // Force reset baseline
            memory = memoryManager.initialize(validationResult.summary);
            console.log(chalk.green('✓ Architectural baseline updated'));
        } else if (!memory) {
            // Initialize memory if missing
            memory = memoryManager.initialize(validationResult.summary);
            console.log(chalk.gray('ℹ Initialized new architectural memory'));
        } else {
            // Check for drift
            if (memoryManager.checkDrift(validationResult.summary, memory)) {
                console.error(chalk.red('\n🚨 ARCHITECTURAL DRIFT DETECTED'));
                console.error(
                    `  Errors increased from ${memory.baseline.errors} to ${validationResult.summary.errors}`
                );
                console.error(
                    chalk.yellow('  Fix the new errors or run with --baseline to accept the new state')
                );
                process.exit(1);
            }

            // Ratchet down baseline if improved
            if (memoryManager.ratchet(validationResult.summary, memory)) {
                console.log(chalk.green('\n✨ Architectural baseline improved!'));
                console.log(`  Errors reduced from ${memory.baseline.errors + (memory.baseline.errors - validationResult.summary.errors)} to ${validationResult.summary.errors}`);
            }
        }

        // Output results using formatter
        if (format === 'json') {
            console.log(OutputFormatter.formatJSON(validationResult));
        } else {
            console.log(OutputFormatter.formatText(validationResult));
        }

        // Exit with appropriate code
        if (totalErrors > 0) {
            process.exit(1);
        }
    }
}
