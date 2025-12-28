import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs';
import * as path from 'path';
import { IParser, FileAnalysis, ImportInfo, ExportInfo, FunctionInfo, ClassInfo } from './types';

export class JavaScriptParser implements IParser {
    private static readonly SUPPORTED_EXTENSIONS = ['.js', '.jsx', '.mjs'];

    supports(filePath: string): boolean {
        const ext = path.extname(filePath);
        return JavaScriptParser.SUPPORTED_EXTENSIONS.includes(ext);
    }

    parse(filePath: string, content?: string): FileAnalysis {
        const sourceCode = content ?? fs.readFileSync(filePath, 'utf-8');

        const analysis: FileAnalysis = {
            filePath,
            language: 'javascript',
            imports: [],
            exports: [],
            functions: [],
            classes: [],
            errors: [],
        };

        try {
            const ast = parser.parse(sourceCode, {
                sourceType: 'module',
                plugins: ['jsx', 'dynamicImport'],
            });

            traverse(ast, {
                // Extract imports
                ImportDeclaration: (nodePath) => {
                    const node = nodePath.node;
                    const importInfo: ImportInfo = {
                        module: node.source.value,
                        line: node.loc?.start.line ?? 0,
                        column: node.loc?.start.column ?? 0,
                        isRelative: node.source.value.startsWith('.') || node.source.value.startsWith('..'),
                        importedNames: [],
                    };

                    // Extract imported names
                    for (const specifier of node.specifiers) {
                        if (specifier.type === 'ImportDefaultSpecifier') {
                            importInfo.isDefault = true;
                            importInfo.importedNames?.push(specifier.local.name);
                        } else if (specifier.type === 'ImportSpecifier') {
                            const imported =
                                specifier.imported.type === 'Identifier'
                                    ? specifier.imported.name
                                    : specifier.imported.value;
                            importInfo.importedNames?.push(imported);
                        } else if (specifier.type === 'ImportNamespaceSpecifier') {
                            importInfo.isNamespace = true;
                            importInfo.importedNames?.push(specifier.local.name);
                        }
                    }

                    // Resolve relative imports
                    if (importInfo.isRelative) {
                        const dir = path.dirname(filePath);
                        importInfo.resolvedPath = path.resolve(dir, importInfo.module);
                    }

                    analysis.imports.push(importInfo);
                },

                // Extract dynamic imports and require() calls
                CallExpression: (nodePath) => {
                    const node = nodePath.node;

                    // Dynamic import: import('./module')
                    if (node.callee.type === 'Import') {
                        const arg = node.arguments[0];
                        if (arg && arg.type === 'StringLiteral') {
                            analysis.imports.push({
                                module: arg.value,
                                line: node.loc?.start.line ?? 0,
                                column: node.loc?.start.column ?? 0,
                                isRelative: arg.value.startsWith('.') || arg.value.startsWith('..'),
                                isDynamic: true,
                                importedNames: [],
                            });
                        }
                    }

                    // require(): require('./module')
                    if (node.callee.type === 'Identifier' && node.callee.name === 'require') {
                        const arg = node.arguments[0];
                        if (arg && arg.type === 'StringLiteral') {
                            analysis.imports.push({
                                module: arg.value,
                                line: node.loc?.start.line ?? 0,
                                column: node.loc?.start.column ?? 0,
                                isRelative: arg.value.startsWith('.') || arg.value.startsWith('..'),
                                isRequire: true,
                                importedNames: [],
                            });
                        }
                    }
                },

                // Extract exports
                ExportNamedDeclaration: (nodePath) => {
                    const node = nodePath.node;

                    if (node.declaration) {
                        // export function foo() {} or export const bar = ...
                        const name = this.getDeclarationName(node.declaration);
                        if (name) {
                            analysis.exports.push({
                                name,
                                line: node.loc?.start.line ?? 0,
                                column: node.loc?.start.column ?? 0,
                                isDefault: false,
                                isReExport: false,
                            });
                        }
                    } else if (node.specifiers) {
                        // export { foo, bar }
                        for (const specifier of node.specifiers) {
                            const exported =
                                specifier.exported.type === 'Identifier'
                                    ? specifier.exported.name
                                    : specifier.exported.value;
                            analysis.exports.push({
                                name: exported,
                                line: node.loc?.start.line ?? 0,
                                column: node.loc?.start.column ?? 0,
                                isDefault: false,
                                isReExport: !!node.source,
                                fromModule: node.source?.value,
                            });
                        }
                    }
                },

                ExportDefaultDeclaration: (nodePath) => {
                    const node = nodePath.node;
                    analysis.exports.push({
                        name: 'default',
                        line: node.loc?.start.line ?? 0,
                        column: node.loc?.start.column ?? 0,
                        isDefault: true,
                        isReExport: false,
                    });
                },

                // Extract functions
                FunctionDeclaration: (nodePath) => {
                    const node = nodePath.node;
                    analysis.functions.push({
                        name: node.id?.name ?? '<anonymous>',
                        line: node.loc?.start.line ?? 0,
                        column: node.loc?.start.column ?? 0,
                        endLine: node.loc?.end.line ?? 0,
                        body: sourceCode.substring(node.start ?? 0, node.end ?? 0),
                        params: node.params.map((p) => {
                            if (p.type === 'Identifier') return p.name;
                            if (p.type === 'RestElement' && p.argument.type === 'Identifier')
                                return `...${p.argument.name}`;
                            return '';
                        }),
                        isAsync: node.async,
                        isGenerator: node.generator,
                        isArrowFunction: false,
                    });
                },

                // Extract classes
                ClassDeclaration: (nodePath) => {
                    const node = nodePath.node;
                    const classInfo: ClassInfo = {
                        name: node.id?.name ?? '<anonymous>',
                        line: node.loc?.start.line ?? 0,
                        column: node.loc?.start.column ?? 0,
                        methods: [],
                        properties: [],
                    };

                    for (const member of node.body.body) {
                        if (member.type === 'ClassMethod') {
                            const methodName =
                                member.key.type === 'Identifier' ? member.key.name : '<computed>';
                            classInfo.methods.push({
                                name: methodName,
                                line: member.loc?.start.line ?? 0,
                                column: member.loc?.start.column ?? 0,
                                endLine: member.loc?.end.line ?? 0,
                                body: sourceCode.substring(member.start ?? 0, member.end ?? 0),
                                params: member.params.map((p) => {
                                    if (p.type === 'Identifier') return p.name;
                                    if (p.type === 'RestElement' && p.argument.type === 'Identifier')
                                        return `...${p.argument.name}`;
                                    return '';
                                }),
                                isAsync: member.async,
                                isGenerator: member.generator,
                                isArrowFunction: false,
                            });
                        } else if (member.type === 'ClassProperty') {
                            const propName =
                                member.key.type === 'Identifier' ? member.key.name : '<computed>';
                            classInfo.properties.push(propName);
                        }
                    }

                    analysis.classes.push(classInfo);
                },
            });
        } catch (error: unknown) {
            const err = error as { message: string; loc?: { line: number; column: number } };
            analysis.errors.push({
                message: err.message,
                line: err.loc?.line ?? 0,
                column: err.loc?.column ?? 0,
            });
        }

        return analysis;
    }

    private getDeclarationName(declaration: unknown): string | null {
        const decl = declaration as {
            id?: { name?: string };
            declarations?: Array<{ id?: { name?: string } }>;
        };

        if (decl.id?.name) {
            return decl.id.name;
        }
        if (decl.declarations?.[0]?.id?.name) {
            return decl.declarations[0].id.name;
        }
        return null;
    }
}
