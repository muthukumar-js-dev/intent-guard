import { execSync } from 'child_process';
import * as path from 'path';

export class GitUtils {
    /**
     * Check if directory is a git repository
     */
    static isGitRepository(projectRoot: string): boolean {
        try {
            execSync('git rev-parse --git-dir', {
                cwd: projectRoot,
                stdio: 'ignore',
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get list of changed files using git diff
     * @param projectRoot - Project root directory
     * @param base - Base branch/commit (default: HEAD)
     * @param includeUntracked - Include untracked files (default: true)
     * @returns Array of absolute file paths
     */
    static getChangedFiles(
        projectRoot: string,
        base: string = 'HEAD',
        includeUntracked: boolean = true
    ): string[] {
        try {
            const files: string[] = [];

            // Get modified and staged files
            const diffOutput = execSync(`git diff --name-only ${base}`, {
                cwd: projectRoot,
                encoding: 'utf-8',
            });

            files.push(...diffOutput.split('\n').filter(Boolean));

            // Get untracked files if requested
            if (includeUntracked) {
                const untrackedOutput = execSync('git ls-files --others --exclude-standard', {
                    cwd: projectRoot,
                    encoding: 'utf-8',
                });

                files.push(...untrackedOutput.split('\n').filter(Boolean));
            }

            // Convert to absolute paths and deduplicate
            const absolutePaths = files.map((file) => path.resolve(projectRoot, file));
            return [...new Set(absolutePaths)];
        } catch (error) {
            throw new Error(`Failed to get changed files: ${(error as Error).message}`);
        }
    }

    /**
     * Get files changed in current branch compared to main/master
     */
    static getBranchChangedFiles(projectRoot: string): string[] {
        try {
            // Try main first, then master
            const baseBranch = this.getBaseBranch(projectRoot);
            return this.getChangedFiles(projectRoot, baseBranch, true);
        } catch {
            // Fallback to HEAD if can't determine base branch
            return this.getChangedFiles(projectRoot, 'HEAD', true);
        }
    }

    /**
     * Determine base branch (main or master)
     */
    private static getBaseBranch(projectRoot: string): string {
        try {
            // Check if main exists
            execSync('git rev-parse --verify main', {
                cwd: projectRoot,
                stdio: 'ignore',
            });
            return 'main';
        } catch {
            // Fallback to master
            return 'master';
        }
    }
}
