import { IntentGuardConfig, ValidationResult, Violation, DependencyGraph } from '../../types';
import * as path from 'path';

export class LayerBoundaryValidator {
    private config: IntentGuardConfig;
    private graph: DependencyGraph;
    private projectRoot: string;

    constructor(config: IntentGuardConfig, graph: DependencyGraph, projectRoot: string) {
        this.config = config;
        this.graph = graph;
        this.projectRoot = projectRoot;
    }

    validate(): ValidationResult {
        const violations: Violation[] = [];

        for (const edge of this.graph.edges) {
            const fromNode = this.graph.nodes.find((n) => n.id === edge.from);
            const toNode = this.graph.nodes.find((n) => n.id === edge.to);

            if (!fromNode || !toNode) continue;
            if (!fromNode.layer || !toNode.layer) continue;

            const fromLayer = this.config.architecture.layers.find((l) => l.name === fromNode.layer);
            if (!fromLayer) continue;

            // Check if import is allowed (allow intra-layer imports)
            if (fromNode.layer !== toNode.layer && !fromLayer.canImportFrom.includes(toNode.layer)) {
                // Build helpful suggestion with layer paths
                const allowedLayers = fromLayer.canImportFrom.map(layerName => {
                    const layer = this.config.architecture.layers.find(l => l.name === layerName);
                    return layer ? `${layerName} (${layer.path})` : layerName;
                }).join(' or ');

                // Make file path relative to project root (if it's absolute)
                const relativePath = path.isAbsolute(fromNode.filePath)
                    ? path.relative(this.projectRoot, fromNode.filePath)
                    : fromNode.filePath;

                violations.push({
                    ruleId: 'layer-boundary',
                    severity: 'error',
                    file: relativePath,
                    line: edge.importLine,
                    message: `Layer "${fromLayer.name}" cannot import from layer "${toNode.layer}"`,
                    suggestion: allowedLayers
                        ? `Allowed imports: ${allowedLayers}`
                        : 'This layer cannot import from any other layers',
                    autoFixable: false,
                });
            }

            // Check if import is explicitly forbidden
            if (fromLayer.cannotImportFrom?.includes(toNode.layer)) {
                // Build helpful suggestion with layer paths
                const allowedLayers = fromLayer.canImportFrom.map(layerName => {
                    const layer = this.config.architecture.layers.find(l => l.name === layerName);
                    return layer ? `${layerName} (${layer.path})` : layerName;
                }).join(' or ');

                // Make file path relative to project root
                const relativePath = path.relative(this.projectRoot, fromNode.filePath);

                violations.push({
                    ruleId: 'layer-boundary-forbidden',
                    severity: 'error',
                    file: relativePath,
                    line: edge.importLine,
                    message: `Layer "${fromLayer.name}" explicitly cannot import from "${toNode.layer}"`,
                    suggestion: allowedLayers
                        ? `Remove this import or refactor to use: ${allowedLayers}`
                        : 'Remove this import - this layer cannot import from any other layers',
                    autoFixable: false,
                });
            }
        }

        return {
            valid: violations.length === 0,
            violations,
            summary: {
                errors: violations.filter((v) => v.severity === 'error').length,
                warnings: violations.filter((v) => v.severity === 'warning').length,
                filesAnalyzed: this.graph.nodes.length,
            },
        };
    }
}
