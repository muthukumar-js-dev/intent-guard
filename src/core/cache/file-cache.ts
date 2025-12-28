import * as fs from 'fs';
import * as path from 'path';
import { CacheData, CacheEntry } from '../../types';

export class FileCache {
    private cachePath: string;
    private data: CacheData;
    private static readonly CURRENT_VERSION = '1.0.0';

    constructor(projectRoot: string) {
        this.cachePath = path.join(projectRoot, '.intentguard', 'cache', 'graph.json');
        this.data = {
            version: FileCache.CURRENT_VERSION,
            entries: {},
        };
    }

    /**
     * Load cache from disk
     */
    async load(): Promise<void> {
        try {
            if (fs.existsSync(this.cachePath)) {
                const content = await fs.promises.readFile(this.cachePath, 'utf-8');
                const loadedData = JSON.parse(content) as CacheData;

                // Invalidate if version mismatch
                if (loadedData.version === FileCache.CURRENT_VERSION) {
                    this.data = loadedData;
                }
            }
        } catch (error) {
            // If load fails, we just start with empty cache
            console.warn('Failed to load cache, starting fresh.');
        }
    }

    /**
     * Save cache to disk
     */
    async save(): Promise<void> {
        try {
            const dir = path.dirname(this.cachePath);
            if (!fs.existsSync(dir)) {
                await fs.promises.mkdir(dir, { recursive: true });
            }
            await fs.promises.writeFile(this.cachePath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.warn('Failed to save cache:', error);
        }
    }

    /**
     * Get entry for a file
     */
    get(filePath: string): CacheEntry | undefined {
        return this.data.entries[filePath];
    }

    /**
     * Set entry for a file
     */
    set(filePath: string, entry: CacheEntry): void {
        this.data.entries[filePath] = entry;
    }

    /**
     * Clear the cache
     */
    clear(): void {
        this.data.entries = {};
    }
}
