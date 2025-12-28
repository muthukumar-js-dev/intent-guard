import { IntentGuardConfig, ValidationResult, Violation, DependencyGraph } from '../../types';
import { ParserFactory } from '../parsers';

export class BannedDependenciesValidator {
    private config: IntentGuardConfig;
    private graph: DependencyGraph;

    constructor(config: IntentGuardConfig, graph: DependencyGraph) {
        this.config = config;
        this.graph = graph;
    }

    async validate(): Promise<ValidationResult> {
        const violations: Violation[] = [];

        if (!this.config.bannedDependencies || this.config.bannedDependencies.length === 0) {
            return {
                valid: true,
                violations: [],
                summary: { errors: 0, warnings: 0, filesAnalyzed: 0 },
            };
        }

        for (const node of this.graph.nodes) {
            const parser = ParserFactory.getParser(node.filePath);
            if (!parser) continue;

            const analysis = parser.parse(node.filePath);

            for (const importInfo of analysis.imports) {
                for (const banned of this.config.bannedDependencies) {
                    // Check banned package
                    if (banned.package && importInfo.module === banned.package) {
                        violations.push({
                            ruleId: 'banned-dependency',
                            severity: 'error',
                            file: node.filePath,
                            line: importInfo.line,
                            message: `Banned dependency: ${banned.package} - ${banned.reason}`,
                            suggestion: banned.alternatives
                                ? `Use ${banned.alternatives.join(' or ')} instead`
                                : 'Remove this dependency',
                            autoFixable: false,
                        });
                    }

                    // Check banned pattern (e.g., "src/presentation/** -> src/infrastructure/**")
                    if (banned.pattern) {
                        const [fromPattern, toPattern] = banned.pattern.split('->').map((s) => s.trim());

                        if (
                            this.matchesPattern(node.filePath, fromPattern) &&
                            importInfo.resolvedPath &&
                            this.matchesPattern(importInfo.resolvedPath, toPattern)
                        ) {
                            violations.push({
                                ruleId: 'banned-dependency-pattern',
                                severity: 'error',
                                file: node.filePath,
                                line: importInfo.line,
                                message: `Banned import pattern: ${banned.reason}`,
                                suggestion: banned.alternatives
                                    ? `Use ${banned.alternatives.join(' or ')} instead`
                                    : 'Refactor to avoid this dependency',
                                autoFixable: false,
                            });
                        }
                    }
                }
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

    private matchesPattern(filePath: string, pattern: string): boolean {
        const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
        return regex.test(filePath);
    }
}
