import { GitUtils } from '../../../src/utils/git';
import * as path from 'path';

describe('GitUtils', () => {
    const projectRoot = process.cwd(); // Assuming tests run in git repo

    describe('isGitRepository', () => {
        it('should return true for git repository', () => {
            expect(GitUtils.isGitRepository(projectRoot)).toBe(true);
        });

        it('should return false for non-git directory', () => {
            // Use a temp directory that's not a git repo
            expect(GitUtils.isGitRepository('/tmp')).toBe(false);
        });
    });

    describe('getChangedFiles', () => {
        it('should return array of file paths', () => {
            const files = GitUtils.getChangedFiles(projectRoot);
            expect(Array.isArray(files)).toBe(true);
        });

        it('should return absolute paths', () => {
            const files = GitUtils.getChangedFiles(projectRoot);
            files.forEach((file) => {
                expect(path.isAbsolute(file)).toBe(true);
            });
        });

        it('should throw error for non-git directory', () => {
            expect(() => {
                GitUtils.getChangedFiles('/tmp');
            }).toThrow('Failed to get changed files');
        });

        it('should not include duplicate files', () => {
            const files = GitUtils.getChangedFiles(projectRoot);
            const uniqueFiles = [...new Set(files)];
            expect(files.length).toBe(uniqueFiles.length);
        });
    });

    describe('getBranchChangedFiles', () => {
        it('should return files changed in current branch', () => {
            const files = GitUtils.getBranchChangedFiles(projectRoot);
            expect(Array.isArray(files)).toBe(true);
        });

        it('should return absolute paths', () => {
            const files = GitUtils.getBranchChangedFiles(projectRoot);
            files.forEach((file) => {
                expect(path.isAbsolute(file)).toBe(true);
            });
        });
    });
});
