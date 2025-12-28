import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { IntentGuardConfig, LayerDefinition } from '../types';
import { CONFIG_SCHEMA, DEFAULT_CONFIG } from './schema';
import { validateSchema } from './validator';

export class ConfigLoader {
    private static readonly CONFIG_FILE_NAME = 'intent.config.yaml';
    private static readonly CONFIG_DIR_NAME = '.intentguard';
    private static configCache: Map<string, IntentGuardConfig> = new Map();

    /**
     * Find and load configuration file from project root
     * @param startDir - Directory to start searching from (defaults to cwd)
     * @returns Loaded and validated configuration
     * @throws Error if config not found or invalid
     */
    static load(startDir: string = process.cwd()): IntentGuardConfig {
        const configPath = this.findConfigFile(startDir);

        if (!configPath) {
            throw new Error(
                `Configuration file not found in ${startDir}\n` +
                `Expected: .intentguard/intent.config.yaml\n` +
                `Run 'npx intent-guard init' to create a configuration file.`
            );
        }

        // Check cache first
        if (this.configCache.has(configPath)) {
            return this.configCache.get(configPath)!;
        }

        // Load and cache
        const config = this.loadFromFile(configPath);
        this.configCache.set(configPath, config);
        return config;
    }

    /**
     * Load configuration from specific file path
     * @param filePath - Absolute path to config file
     * @returns Loaded and validated configuration
     */
    static loadFromFile(filePath: string): IntentGuardConfig {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const parsed = yaml.parse(fileContent);

            // Merge with defaults
            const config: IntentGuardConfig = {
                ...DEFAULT_CONFIG,
                ...parsed,
            } as IntentGuardConfig;

            // Validate against schema
            const validation = validateSchema(config, CONFIG_SCHEMA);

            if (!validation.valid) {
                throw new Error(
                    `Invalid configuration file: ${filePath}\n` +
                    validation.errors.map((e) => `  - ${e}`).join('\n')
                );
            }

            // Additional semantic validation
            this.validateSemantics(config);

            return config;
        } catch (error) {
            if (error instanceof yaml.YAMLParseError) {
                throw new Error(
                    `Failed to parse YAML configuration: ${filePath}\n` + `Error: ${error.message}`
                );
            }
            throw error;
        }
    }

    /**
     * Find config file by walking up directory tree
     * @param startDir - Directory to start searching from
     * @returns Absolute path to config file, or null if not found
     */
    private static findConfigFile(startDir: string): string | null {
        let currentDir = path.resolve(startDir);
        const root = path.parse(currentDir).root;

        while (currentDir !== root) {
            const configPath = path.join(currentDir, this.CONFIG_DIR_NAME, this.CONFIG_FILE_NAME);

            if (fs.existsSync(configPath)) {
                return configPath;
            }

            currentDir = path.dirname(currentDir);
        }

        return null;
    }

    /**
     * Validate semantic rules that can't be expressed in JSON schema
     * @param config - Configuration to validate
     * @throws Error if semantic validation fails
     */
    private static validateSemantics(config: IntentGuardConfig): void {
        // Check for duplicate layer names
        const layerNames = config.architecture.layers.map((l) => l.name);
        const duplicates = layerNames.filter((name, index) => layerNames.indexOf(name) !== index);

        if (duplicates.length > 0) {
            throw new Error(
                `Duplicate layer names found: ${duplicates.join(', ')}\n` +
                `Each layer must have a unique name.`
            );
        }

        // Check that canImportFrom references valid layers
        for (const layer of config.architecture.layers) {
            for (const importFrom of layer.canImportFrom) {
                if (!layerNames.includes(importFrom)) {
                    throw new Error(
                        `Layer "${layer.name}" references unknown layer "${importFrom}" in canImportFrom.\n` +
                        `Available layers: ${layerNames.join(', ')}`
                    );
                }
            }

            // Check cannotImportFrom if present
            if (layer.cannotImportFrom) {
                for (const cannotImport of layer.cannotImportFrom) {
                    if (!layerNames.includes(cannotImport)) {
                        throw new Error(
                            `Layer "${layer.name}" references unknown layer "${cannotImport}" in cannotImportFrom.\n` +
                            `Available layers: ${layerNames.join(', ')}`
                        );
                    }
                }
            }
        }

        // Check for circular dependencies (optional, but good to have)
        this.detectCircularDependencies(config.architecture.layers);

        // Validate banned dependencies have either package or pattern
        if (config.bannedDependencies) {
            for (const banned of config.bannedDependencies) {
                if (!banned.package && !banned.pattern) {
                    throw new Error(
                        `Banned dependency must specify either 'package' or 'pattern'.\n` +
                        `Reason: ${banned.reason}`
                    );
                }
            }
        }
    }

    /**
     * Detect circular dependencies in layer definitions
     * @param layers - Layer definitions to check
     * @throws Error if circular dependency detected
     */
    private static detectCircularDependencies(layers: LayerDefinition[]): void {
        const graph = new Map<string, Set<string>>();

        // Build adjacency list
        for (const layer of layers) {
            graph.set(layer.name, new Set(layer.canImportFrom));
        }

        // DFS to detect cycles
        const visited = new Set<string>();
        const recStack = new Set<string>();

        const hasCycle = (node: string): boolean => {
            visited.add(node);
            recStack.add(node);

            const neighbors = graph.get(node) || new Set();
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (hasCycle(neighbor)) return true;
                } else if (recStack.has(neighbor)) {
                    return true;
                }
            }

            recStack.delete(node);
            return false;
        };

        for (const layer of layers) {
            if (!visited.has(layer.name)) {
                if (hasCycle(layer.name)) {
                    throw new Error(
                        `Circular dependency detected in layer definitions.\n` +
                        `This creates an invalid architecture. Please review your canImportFrom rules.`
                    );
                }
            }
        }
    }

    /**
     * Get the project root directory (where .intentguard/ is located)
     * @param startDir - Directory to start searching from
     * @returns Absolute path to project root, or null if not found
     */
    static findProjectRoot(startDir: string = process.cwd()): string | null {
        const configPath = this.findConfigFile(startDir);
        if (!configPath) return null;

        // Project root is parent of .intentguard/
        return path.dirname(path.dirname(configPath));
    }

    /**
     * Clear the configuration cache
     * Useful for testing or when config file changes
     */
    static clearCache(): void {
        this.configCache.clear();
    }
}
