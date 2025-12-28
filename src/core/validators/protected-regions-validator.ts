import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
import { IntentGuardConfig, ValidationResult, Violation } from '../../types';

export class ProtectedRegionsValidator {
    private config: IntentGuardConfig;
    private projectRoot: string;

    constructor(config: IntentGuardConfig, projectRoot: string) {
        this.config = config;
        this.projectRoot = projectRoot;
    }

    /**
     * Validate that protected regions have not been modified
     * @param changedFiles - List of files that have been modified (optional)
     */
    async validate(changedFiles?: string[]): Promise<ValidationResult> {
        const violations: Violation[] = [];
        let totalMatchedFiles = 0;

        if (!this.config.protectedRegions || this.config.protectedRegions.length === 0) {
            return {
                valid: true,
                violations: [],
                summary: { errors: 0, warnings: 0, filesAnalyzed: 0 },
            };
        }

        for (const region of this.config.protectedRegions) {
            if (region.aiMutable) continue; // Skip mutable regions

            const matchedFiles = await this.findMatchingFiles(region.path);
            totalMatchedFiles += matchedFiles.length;

            for (const file of matchedFiles) {
                // If changedFiles provided, only check those files
                if (changedFiles && !changedFiles.includes(file)) {
                    continue;
                }

                if (changedFiles) {
                    // Check for block-level protection first
                    const hasBlockProtection = await this.checkBlockProtection(file);

                    if (hasBlockProtection) {
                        try {
                            const isViolated = await this.validateProtectedBlocks(file);
                            if (isViolated) {
                                violations.push({
                                    ruleId: 'protected-region',
                                    severity: 'error',
                                    file,
                                    message: `Protected block modification detected`,
                                    suggestion: 'You modified a block marked with // #protected-start ... // #protected-end. Revert changes to this block.',
                                    autoFixable: false,
                                });
                            }
                        } catch (error) {
                            console.warn(`Failed to validate blocks for ${file}:`, error);
                        }
                    } else {
                        // Fallback to file-level protection
                        violations.push({
                            ruleId: 'protected-region',
                            severity: 'error',
                            file,
                            message: `Protected region: ${region.reason}`,
                            suggestion: 'This entire file is protected. Revert changes.',
                            autoFixable: false,
                        });
                    }
                } else {
                    // Non-diff mode: Warning only
                    violations.push({
                        ruleId: 'protected-region',
                        severity: 'warning',
                        file,
                        message: `Protected region: ${region.reason}`,
                        suggestion: 'This file is protected. Use --diff mode to validate changes.',
                        autoFixable: false,
                    });
                }
            }
        }

        return {
            valid: violations.filter(v => v.severity === 'error').length === 0,
            violations,
            summary: {
                errors: violations.filter((v) => v.severity === 'error').length,
                warnings: violations.filter((v) => v.severity === 'warning').length,
                filesAnalyzed: changedFiles?.length ?? totalMatchedFiles,
            },
        };
    }

    private async checkBlockProtection(filePath: string): Promise<boolean> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            return content.includes('#protected-start');
        } catch {
            return false;
        }
    }

    private async validateProtectedBlocks(filePath: string): Promise<boolean> {
        // Get current content
        const currentContent = await fs.promises.readFile(filePath, 'utf-8');
        const currentBlocks = this.extractBlocks(currentContent);

        // Get previous content from git
        try {
            // Get relative path for git command
            const relativePath = path.relative(this.projectRoot, filePath).replace(/\\/g, '/');
            const previousContent = require('child_process').execSync(`git show HEAD:${relativePath}`, {
                cwd: this.projectRoot,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            });
            const previousBlocks = this.extractBlocks(previousContent);

            // Compare blocks
            return JSON.stringify(currentBlocks) !== JSON.stringify(previousBlocks);
        } catch (error) {
            // If new file or git error, assume violation if blocks exist? 
            // Or just fail safe. Let's assume strict protection.
            return true;
        }
    }

    private extractBlocks(content: string): string[] {
        const blocks: string[] = [];
        const lines = content.split('\n');
        let capturing = false;
        let currentBlock: string[] = [];

        for (const line of lines) {
            if (line.includes('#protected-start')) {
                capturing = true;
                continue;
            }
            if (line.includes('#protected-end')) {
                capturing = false;
                if (currentBlock.length > 0) {
                    blocks.push(currentBlock.join('\n'));
                    currentBlock = [];
                }
                continue;
            }
            if (capturing) {
                currentBlock.push(line.trim()); // Trim to ignore whitespace changes in indent? No, be strict.
            }
        }
        return blocks;
    }

    private async findMatchingFiles(pattern: string): Promise<string[]> {
        // Normalize path for glob (use forward slashes)
        const absolutePattern = path.join(this.projectRoot, pattern).replace(/\\/g, '/');
        return await glob(absolutePattern, {
            windowsPathsNoEscape: true,
        });
    }
}
