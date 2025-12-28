import * as fs from 'fs';
import * as path from 'path';
import { MemoryData, ValidationSummary } from '../../types';

export class MemoryManager {
    private static readonly MEMORY_FILE = 'memory.json';
    private memoryPath: string;

    constructor(projectRoot: string) {
        this.memoryPath = path.join(projectRoot, '.intentguard', MemoryManager.MEMORY_FILE);
    }

    /**
     * Load architectural memory from disk
     */
    load(): MemoryData | null {
        if (!fs.existsSync(this.memoryPath)) {
            return null;
        }

        try {
            const content = fs.readFileSync(this.memoryPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.warn('Failed to load memory file:', error);
            return null;
        }
    }

    /**
     * Save architectural memory to disk
     */
    save(data: MemoryData): void {
        try {
            fs.writeFileSync(this.memoryPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.warn('Failed to save memory file:', error);
        }
    }

    /**
     * Initialize memory with current validation results as baseline
     */
    initialize(summary: ValidationSummary): MemoryData {
        const data: MemoryData = {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            baseline: {
                errors: summary.errors,
                warnings: summary.warnings,
            },
            snapshot: summary,
        };
        this.save(data);
        return data;
    }

    /**
     * Check for architectural drift
     * Returns true if drift detected (current errors > baseline)
     */
    checkDrift(current: ValidationSummary, memory: MemoryData): boolean {
        return current.errors > memory.baseline.errors;
    }

    /**
     * Update baseline if current results are better (Ratchet)
     */
    ratchet(current: ValidationSummary, memory: MemoryData): boolean {
        if (current.errors < memory.baseline.errors) {
            memory.baseline.errors = current.errors;
            memory.lastUpdated = new Date().toISOString();
            memory.snapshot = current;
            this.save(memory);
            return true;
        }
        return false;
    }
}
