import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import {
    IParser,
    FileAnalysis,
    ImportInfo,
    ExportInfo,
    FunctionInfo,
    ClassInfo,
} from './types';

export class TypeScriptParser implements IParser {
    private static readonly SUPPORTED_EXTENSIONS = ['.ts', '.tsx'];

    supports(filePath: string): boolean {
        const ext = path.extname(filePath);
        return TypeScriptParser.SUPPORTED_EXTENSIONS.includes(ext);
    }

    parse(filePath: string, content?: string): FileAnalysis {
        const sourceCode = content ?? fs.readFileSync(filePath, 'utf-8');

        const sourceFile = ts.createSourceFile(
            filePath,
            sourceCode,
            ts.ScriptTarget.Latest,
            true // setParentNodes
        );

        const analysis: FileAnalysis = {
            filePath,
            language: 'typescript',
            imports: [],
            exports: [],
            functions: [],
            classes: [],
            errors: [],
        };

        // Extract information by traversing AST
        this.traverse(sourceFile, analysis);

        return analysis;
    }

    private traverse(node: ts.Node, analysis: FileAnalysis): void {
        // Extract imports
        if (ts.isImportDeclaration(node)) {
            const importInfo = this.extractImport(node, analysis.filePath);
            if (importInfo) {
                analysis.imports.push(importInfo);
            }
        }

        // Extract dynamic imports and require() calls
        if (ts.isCallExpression(node)) {
            const sourceFile = node.getSourceFile();

            // Dynamic import: import('./module')
            if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
                const arg = node.arguments[0];
                if (ts.isStringLiteral(arg)) {
                    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    analysis.imports.push({
                        module: arg.text,
                        line: line + 1,
                        column: character,
                        isRelative: arg.text.startsWith('.') || arg.text.startsWith('..'),
                        isDynamic: true,
                        importedNames: [],
                    });
                }
            }

            // require(): require('./module')
            if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
                const arg = node.arguments[0];
                if (ts.isStringLiteral(arg)) {
                    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    analysis.imports.push({
                        module: arg.text,
                        line: line + 1,
                        column: character,
                        isRelative: arg.text.startsWith('.') || arg.text.startsWith('..'),
                        isRequire: true,
                        importedNames: [],
                    });
                }
            }
        }

        // Extract exports
        if (this.isExportNode(node)) {
            const exportInfos = this.extractExport(node);
            analysis.exports.push(...exportInfos);
        }

        // Extract functions
        if (this.isFunctionNode(node)) {
            const functionInfo = this.extractFunction(node);
            if (functionInfo) {
                analysis.functions.push(functionInfo);
            }
        }

        // Extract classes
        if (ts.isClassDeclaration(node)) {
            const classInfo = this.extractClass(node);
            if (classInfo) {
                analysis.classes.push(classInfo);
            }
        }

        // Recursively traverse children
        ts.forEachChild(node, (child) => this.traverse(child, analysis));
    }

    private extractImport(node: ts.ImportDeclaration, filePath: string): ImportInfo | null {
        const moduleSpecifier = node.moduleSpecifier;

        if (!ts.isStringLiteral(moduleSpecifier)) {
            return null;
        }

        const module = moduleSpecifier.text;
        const sourceFile = node.getSourceFile();
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

        const importInfo: ImportInfo = {
            module,
            line: line + 1, // Convert to 1-indexed
            column: character,
            isRelative: module.startsWith('.') || module.startsWith('..'),
            importedNames: [],
        };

        // Extract imported names
        if (node.importClause) {
            const { name, namedBindings } = node.importClause;

            // Default import
            if (name) {
                importInfo.isDefault = true;
                importInfo.importedNames?.push(name.text);
            }

            // Named imports
            if (namedBindings) {
                if (ts.isNamedImports(namedBindings)) {
                    const names = namedBindings.elements.map((e) => e.name.text);
                    if (importInfo.importedNames) {
                        importInfo.importedNames.push(...names);
                    } else {
                        importInfo.importedNames = names;
                    }
                } else if (ts.isNamespaceImport(namedBindings)) {
                    importInfo.isNamespace = true;
                    importInfo.importedNames?.push(namedBindings.name.text);
                }
            }
        }

        // Resolve relative imports
        if (importInfo.isRelative) {
            const dir = path.dirname(filePath);
            importInfo.resolvedPath = path.resolve(dir, module);
        }

        return importInfo;
    }

    private extractExport(node: ts.Node): ExportInfo[] {
        const sourceFile = node.getSourceFile();
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const exports: ExportInfo[] = [];

        // Export declaration (export { foo, bar })
        if (ts.isExportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            const fromModule =
                moduleSpecifier && ts.isStringLiteral(moduleSpecifier)
                    ? moduleSpecifier.text
                    : undefined;

            if (node.exportClause && ts.isNamedExports(node.exportClause)) {
                for (const element of node.exportClause.elements) {
                    exports.push({
                        name: element.name.text,
                        line: line + 1,
                        column: character,
                        isDefault: false,
                        isReExport: !!fromModule,
                        fromModule,
                    });
                }
            }
            return exports;
        }

        // Export assignment (export default foo)
        if (ts.isExportAssignment(node)) {
            return [
                {
                    name: 'default',
                    line: line + 1,
                    column: character,
                    isDefault: true,
                    isReExport: false,
                },
            ];
        }

        // Named export (export function foo() {})
        if (this.hasExportModifier(node)) {
            const name = this.getNodeName(node);
            if (name) {
                return [
                    {
                        name,
                        line: line + 1,
                        column: character,
                        isDefault: this.hasDefaultModifier(node),
                        isReExport: false,
                    },
                ];
            }
        }

        return exports;
    }

    private extractFunction(node: ts.Node): FunctionInfo | null {
        const sourceFile = node.getSourceFile();
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;

        const name = this.getNodeName(node) || '<anonymous>';
        const body = node.getText(sourceFile);

        let params: string[] = [];
        let isAsync = false;
        let isGenerator = false;
        let isArrowFunction = false;

        if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
            params = node.parameters.map((p) => p.name.getText(sourceFile));
            isAsync = !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
            isGenerator = !!node.asteriskToken;
        } else if (ts.isArrowFunction(node)) {
            params = node.parameters.map((p) => p.name.getText(sourceFile));
            isAsync = !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
            isArrowFunction = true;
        } else if (ts.isMethodDeclaration(node)) {
            params = node.parameters.map((p) => p.name.getText(sourceFile));
            isAsync = !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
        }

        return {
            name,
            line: line + 1,
            column: character,
            endLine,
            body,
            params,
            isAsync,
            isGenerator,
            isArrowFunction,
        };
    }

    private extractClass(node: ts.ClassDeclaration): ClassInfo | null {
        const sourceFile = node.getSourceFile();
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

        const name = node.name?.text || '<anonymous>';
        const methods: FunctionInfo[] = [];
        const properties: string[] = [];

        for (const member of node.members) {
            if (ts.isMethodDeclaration(member)) {
                const method = this.extractFunction(member);
                if (method) {
                    methods.push(method);
                }
            } else if (ts.isPropertyDeclaration(member)) {
                const propName = member.name.getText(sourceFile);
                properties.push(propName);
            }
        }

        return {
            name,
            line: line + 1,
            column: character,
            methods,
            properties,
        };
    }

    private isFunctionNode(node: ts.Node): boolean {
        return (
            ts.isFunctionDeclaration(node) ||
            ts.isFunctionExpression(node) ||
            ts.isArrowFunction(node) ||
            ts.isMethodDeclaration(node)
        );
    }

    private isExportNode(node: ts.Node): boolean {
        return (
            ts.isExportDeclaration(node) ||
            ts.isExportAssignment(node) ||
            this.hasExportModifier(node)
        );
    }

    private hasExportModifier(node: ts.Node): boolean {
        if (!('modifiers' in node)) return false;
        const modifiers = (node as { modifiers?: ts.NodeArray<ts.Modifier> }).modifiers;
        return !!modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    }

    private hasDefaultModifier(node: ts.Node): boolean {
        if (!('modifiers' in node)) return false;
        const modifiers = (node as { modifiers?: ts.NodeArray<ts.Modifier> }).modifiers;
        return !!modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    }

    private getNodeName(node: ts.Node): string | null {
        if ('name' in node && node.name) {
            const name = node.name as ts.Identifier | ts.PropertyName;
            if (ts.isIdentifier(name)) {
                return name.text;
            }
        }
        return null;
    }
}
