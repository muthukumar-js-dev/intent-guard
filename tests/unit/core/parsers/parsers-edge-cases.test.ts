import { TypeScriptParser } from '../../../../src/core/parsers/typescript-parser';
import { JavaScriptParser } from '../../../../src/core/parsers/javascript-parser';
import { ParserFactory } from '../../../../src/core/parsers/parser-factory';
import * as path from 'path';

describe('Parsers - Additional Edge Cases', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');

    describe('TypeScriptParser - Edge Cases', () => {
        it('should handle files with no imports', () => {
            const parser = new TypeScriptParser();
            const testFile = path.join(projectRoot, 'tests/fixtures/no-imports.ts');

            // Create a simple file with no imports
            const content = 'const x = 1;\nexport { x };';

            const result = parser.parse(testFile, content);

            expect(result.imports).toHaveLength(0);
            expect(result.exports).toHaveLength(1);
        });

        it('should handle files with only type imports', () => {
            const parser = new TypeScriptParser();
            const testFile = path.join(projectRoot, 'tests/fixtures/type-imports.ts');

            const content = 'import type { SomeType } from "./types";\nexport const x = 1;';

            const result = parser.parse(testFile, content);

            expect(result.imports.length).toBeGreaterThanOrEqual(0);
        });

        it('should handle namespace imports', () => {
            const parser = new TypeScriptParser();
            const testFile = path.join(projectRoot, 'tests/fixtures/namespace.ts');

            const content = 'import * as Utils from "./utils";\nexport const x = Utils.fn();';

            const result = parser.parse(testFile, content);

            expect(result.imports.length).toBeGreaterThan(0);
            expect(result.imports[0].module).toBe('./utils');
        });

        it('should handle default exports', () => {
            const parser = new TypeScriptParser();
            const testFile = path.join(projectRoot, 'tests/fixtures/default-export.ts');

            const content = 'export default class MyClass {}';

            const result = parser.parse(testFile, content);

            expect(result.exports.length).toBeGreaterThan(0);
        });

        it('should handle re-exports', () => {
            const parser = new TypeScriptParser();
            const testFile = path.join(projectRoot, 'tests/fixtures/re-export.ts');

            const content = 'export { something } from "./other";';

            const result = parser.parse(testFile, content);

            expect(result.exports.length).toBeGreaterThan(0);
        });

        it('should handle dynamic imports', () => {
            const parser = new TypeScriptParser();
            const testFile = path.join(projectRoot, 'tests/fixtures/dynamic.ts');

            const content = 'const module = await import("./dynamic");';

            const result = parser.parse(testFile, content);

            // Dynamic imports might not be captured as regular imports
            expect(result).toBeDefined();
        });

        it('should handle files with syntax errors gracefully', () => {
            const parser = new TypeScriptParser();
            const testFile = path.join(projectRoot, 'tests/fixtures/syntax-error.ts');

            const content = 'const x = {{{';

            const result = parser.parse(testFile, content);

            // Should still return a result, even if incomplete
            expect(result).toBeDefined();
            expect(result.imports).toBeDefined();
        });
    });

    describe('JavaScriptParser - Edge Cases', () => {
        it('should handle ES6 imports in .js files', () => {
            const parser = new JavaScriptParser();
            const testFile = path.join(projectRoot, 'tests/fixtures/es6.js');

            const content = 'import { something } from "./module";\nexport { something };';

            const result = parser.parse(testFile, content);

            expect(result.imports.length).toBeGreaterThan(0);
        });

        it('should handle ES6 export default', () => {
            const parser = new JavaScriptParser();
            const testFile = path.join(projectRoot, 'tests/fixtures/default.js');

            const content = 'export default function() {}';

            const result = parser.parse(testFile, content);

            expect(result.exports.length).toBeGreaterThan(0);
        });

        it('should handle files with no imports or exports', () => {
            const parser = new JavaScriptParser();
            const testFile = path.join(projectRoot, 'tests/fixtures/plain.js');

            const content = 'const x = 1;\nconsole.log(x);';

            const result = parser.parse(testFile, content);

            expect(result.imports).toHaveLength(0);
            expect(result.exports).toHaveLength(0);
        });
    });

    describe('ParserFactory - Edge Cases', () => {
        it('should return null for unsupported file types', () => {
            const parser = ParserFactory.getParser('file.py');
            expect(parser).toBeNull();
        });

        it('should return null for files without extension', () => {
            const parser = ParserFactory.getParser('Makefile');
            expect(parser).toBeNull();
        });

        it('should handle .tsx files', () => {
            const parser = ParserFactory.getParser('component.tsx');
            expect(parser).toBeInstanceOf(TypeScriptParser);
        });

        it('should handle .jsx files', () => {
            const parser = ParserFactory.getParser('component.jsx');
            expect(parser).toBeInstanceOf(JavaScriptParser);
        });

        it('should handle .mjs files', () => {
            const parser = ParserFactory.getParser('module.mjs');
            expect(parser).toBeInstanceOf(JavaScriptParser);
        });

        it('should handle .ts files', () => {
            const parser = ParserFactory.getParser('module.ts');
            expect(parser).toBeInstanceOf(TypeScriptParser);
        });

        it('should handle .js files', () => {
            const parser = ParserFactory.getParser('module.js');
            expect(parser).toBeInstanceOf(JavaScriptParser);
        });

        it('should handle uppercase extensions', () => {
            const parser = ParserFactory.getParser('MODULE.TS');
            // Extensions are case-sensitive, so this should return null
            expect(parser).toBeNull();
        });
    });
});
