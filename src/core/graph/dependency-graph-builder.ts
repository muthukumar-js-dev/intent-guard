import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { minimatch } from 'minimatch';
import { ParserFactory } from '../parsers';
import { IntentGuardConfig, LayerDefinition, DependencyGraph, GraphNode, GraphEdge } from '../../types';
import { FileCache } from '../cache/file-cache';
import { computeFileHash } from '../cache/hash-utils';

export class DependencyGraphBuilder {
    private config: IntentGuardConfig;
    private projectRoot: string;
    private cache?: FileCache;

    constructor(config: IntentGuardConfig, projectRoot: string, cache?: FileCache) {
        this.config = config;
        this.projectRoot = projectRoot;
        this.cache = cache;
    }

    /**
     * Build dependency graph for the entire project
     * @returns Complete dependency graph
     */
    async build(): Promise<DependencyGraph> {
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const fileToNode = new Map<string, GraphNode>();

        // Find all files matching layer patterns
        const allFiles = await this.findAllFiles();

        // Create nodes for each file
        for (const filePath of allFiles) {
            const layer = this.getFileLayer(filePath);
            const node: GraphNode = {
                id: this.normalizeFilePath(filePath),
                filePath,
                layer: layer?.name,
            };
            nodes.push(node);
            fileToNode.set(filePath, node);
        }

        // Parse each file and create edges
        await Promise.all(allFiles.map(filePath => this.processFile(filePath, fileToNode, edges)));

        return { nodes, edges };
    }

    /**
     * Build dependency graph for specific files only (optimized for --diff mode)
     * @param filePaths - Array of absolute file paths to analyze
     * @returns Dependency graph containing only specified files
     */
    async buildForFiles(filePaths: string[]): Promise<DependencyGraph> {
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const fileToNode = new Map<string, GraphNode>();

        // Filter files that match layer patterns
        const relevantFiles = filePaths.filter((filePath) => {
            return this.config.architecture.layers.some((layer) => {
                const pattern = path.join(this.projectRoot, layer.path);
                return minimatch(filePath, pattern, { windowsPathsNoEscape: true });
            });
        });

        // Create nodes for each relevant file
        for (const filePath of relevantFiles) {
            const layer = this.getFileLayer(filePath);
            const node: GraphNode = {
                id: this.normalizeFilePath(filePath),
                filePath,
                layer: layer?.name,
            };
            nodes.push(node);
            fileToNode.set(filePath, node);
        }

        // Parse each file and create edges
        await Promise.all(relevantFiles.map(filePath => this.processFile(filePath, fileToNode, edges)));

        return { nodes, edges };
    }

    /**
     * Find all files matching layer patterns
     */
    private async findAllFiles(): Promise<string[]> {
        const patterns = this.config.architecture.layers.map((l) => l.path);
        const allFiles: string[] = [];

        for (const pattern of patterns) {
            // Normalize path for glob (use forward slashes)
            const absolutePattern = path.join(this.projectRoot, pattern).replace(/\\/g, '/');
            const files = await glob(absolutePattern, {
                ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.spec.ts'],
                windowsPathsNoEscape: true,
                nodir: true,
            });
            allFiles.push(...files);
        }

        // Remove duplicates
        return Array.from(new Set(allFiles));
    }

    /**
     * Get the layer a file belongs to
     */
    private getFileLayer(filePath: string): LayerDefinition | null {
        // Normalize to forward slashes for consistent matching
        const relativePath = path.relative(this.projectRoot, filePath).replace(/\\/g, '/');

        for (const layer of this.config.architecture.layers) {
            // Convert glob pattern to regex safely
            // 1. Placeholder for **
            // 2. Escape regex chars
            // 3. Replace *
            // 4. Restore ** as .*
            let pattern = layer.path
                .replace(/\*\*/g, '__GLOB_STAR__')
                .replace(/\*/g, '[^/]*')
                .replace(/__GLOB_STAR__/g, '.*');

            const regex = new RegExp(`^${pattern}$`);

            if (regex.test(relativePath)) {
                return layer;
            }
        }

        return null;
    }

    /**
     * Resolve import to absolute file path
     */
    private resolveImport(fromFile: string, importModule: string): string | null {
        // Handle relative imports
        if (importModule.startsWith('.')) {
            const dir = path.dirname(fromFile);
            let resolved = path.resolve(dir, importModule);

            // Try with different extensions
            const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
            for (const ext of extensions) {
                const withExt = resolved + ext;
                if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
                    return withExt;
                }

                // Try index files
                const indexPath = path.join(resolved, `index${ext}`);
                if (fs.existsSync(indexPath)) {
                    return indexPath;
                }
            }
        }

        // Handle absolute imports (node_modules, etc.) - ignore for now
        return null;
    }

    /**
     * Normalize file path for consistent comparison
     */
    private normalizeFilePath(filePath: string): string {
        return path.relative(this.projectRoot, filePath).replace(/\\/g, '/');
    }
    /**
     * Process a single file: Check cache or parse, then add edges
     */
    private async processFile(filePath: string, fileToNode: Map<string, GraphNode>, edges: GraphEdge[]) {
        let imports: { module: string; line: number }[] = [];
        let hash = '';

        try {
            // 1. Calculate Hash
            if (this.cache) {
                hash = await computeFileHash(filePath);
                const cached = this.cache.get(filePath);

                if (cached && cached.hash === hash) {
                    // Cache Hit
                    imports = cached.imports;
                }
            }

            // 2. Parse if no cache hit or no imports yet
            if (imports.length === 0) {
                const parser = ParserFactory.getParser(filePath);
                if (!parser) return;

                const analysis = parser.parse(filePath);
                imports = analysis.imports;

                // Update Cache
                if (this.cache && hash) {
                    this.cache.set(filePath, { hash, imports });
                }
            }

            // 3. Create Edges
            for (const importInfo of imports) {
                const resolvedPath = this.resolveImport(filePath, importInfo.module);

                if (resolvedPath && fileToNode.has(resolvedPath)) {
                    edges.push({
                        from: this.normalizeFilePath(filePath),
                        to: this.normalizeFilePath(resolvedPath),
                        importLine: importInfo.line,
                    });
                }
            }

        } catch (error) {
            console.error(`Failed to process ${filePath}:`, error);
        }
    }
}
