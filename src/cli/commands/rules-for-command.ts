import * as path from 'path';
import { BaseCommand } from './base-command';

interface RulesOutput {
    file: string;
    layer?: string;
    canImportFrom?: string[];
    isProtected: boolean;
    protectedReason?: string;
    bannedDependencies?: Array<{
        package?: string;
        pattern?: string;
        reason: string;
        alternatives?: string[];
    }>;
}

export class RulesForCommand extends BaseCommand {
    async execute(filePath: string): Promise<void> {
        // Load config
        this.loadConfig();

        if (!this.config || !this.projectRoot) {
            console.error('Failed to load configuration');
            process.exit(1);
        }

        // Normalize file path
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(process.cwd(), filePath);
        const relativePath = path.relative(this.projectRoot, absolutePath);

        // Find layer
        let layerName: string | undefined;
        let canImportFrom: string[] | undefined;

        for (const layer of this.config.architecture.layers) {
            // Convert glob pattern to regex safely
            let pattern = layer.path
                .replace(/\*\*/g, '__GLOB_STAR__')
                .replace(/\*/g, '[^/]*')
                .replace(/__GLOB_STAR__/g, '.*');

            const regex = new RegExp(`^${pattern}$`);
            const normalizedPath = relativePath.replace(/\\/g, '/');

            if (regex.test(normalizedPath)) {
                layerName = layer.name;
                canImportFrom = layer.canImportFrom;
                break;
            }
        }

        // Check if protected
        let isProtected = false;
        let protectedReason: string | undefined;

        if (this.config.protectedRegions) {
            for (const region of this.config.protectedRegions) {
                if (!region.aiMutable) {
                    // Convert glob pattern to regex safely
                    let pattern = region.path
                        .replace(/\*\*/g, '__GLOB_STAR__')
                        .replace(/\*/g, '[^/]*')
                        .replace(/__GLOB_STAR__/g, '.*');

                    const regex = new RegExp(`^${pattern}$`);

                    if (regex.test(relativePath.replace(/\\/g, '/'))) {
                        isProtected = true;
                        protectedReason = region.reason;
                        break;
                    }
                }
            }
        }

        // Get banned dependencies
        const bannedDependencies = this.config.bannedDependencies || [];

        // Output JSON
        const output: RulesOutput = {
            file: relativePath,
            layer: layerName,
            canImportFrom,
            isProtected,
            protectedReason,
            bannedDependencies: bannedDependencies.map((dep) => ({
                package: dep.package,
                pattern: dep.pattern,
                reason: dep.reason,
                alternatives: dep.alternatives,
            })),
        };

        console.log(JSON.stringify(output, null, 2));
    }
}
