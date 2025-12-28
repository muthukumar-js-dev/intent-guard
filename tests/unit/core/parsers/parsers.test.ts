import { TypeScriptParser } from '../../../../src/core/parsers/typescript-parser';
import { JavaScriptParser } from '../../../../src/core/parsers/javascript-parser';
import { ParserFactory } from '../../../../src/core/parsers/parser-factory';
import type {
    ImportInfo,
    ExportInfo,
    FunctionInfo,
    ClassInfo,
} from '../../../../src/core/parsers/types';
import * as path from 'path';

describe('TypeScriptParser', () => {
    const parser = new TypeScriptParser();
    const fixturesDir = path.join(__dirname, '../../../fixtures/parsers');

    it('should support .ts files', () => {
        expect(parser.supports('test.ts')).toBe(true);
        expect(parser.supports('test.tsx')).toBe(true);
        expect(parser.supports('test.js')).toBe(false);
    });

    it('should extract imports from TS file', () => {
        const filePath = path.join(fixturesDir, 'sample.ts');
        const result = parser.parse(filePath);

        expect(result.imports).toBeDefined();
        expect(result.imports.length).toBeGreaterThan(0);

        const configImport = result.imports.find((i: ImportInfo) => i.module === './config');
        expect(configImport).toBeDefined();
        expect(configImport?.importedNames).toContain('ConfigLoader');
    });

    it('should extract exports from TS file', () => {
        const filePath = path.join(fixturesDir, 'sample.ts');
        const result = parser.parse(filePath);

        expect(result.exports).toBeDefined();
        expect(result.exports.length).toBeGreaterThan(0);

        const defaultExport = result.exports.find((e: ExportInfo) => e.isDefault);
        expect(defaultExport).toBeDefined();
    });

    it('should extract functions from TS file', () => {
        const filePath = path.join(fixturesDir, 'sample.ts');
        const result = parser.parse(filePath);

        expect(result.functions).toBeDefined();
        const validateFunc = result.functions.find(
            (f: FunctionInfo) => f.name === 'validateUserPermissions'
        );
        expect(validateFunc).toBeDefined();
        expect(validateFunc?.params).toContain('user');
        expect(validateFunc?.params).toContain('resource');
    });

    it('should extract classes from TS file', () => {
        const filePath = path.join(fixturesDir, 'sample.ts');
        const result = parser.parse(filePath);

        expect(result.classes).toBeDefined();
        const userService = result.classes.find((c: ClassInfo) => c.name === 'UserService');
        expect(userService).toBeDefined();
        expect(userService?.methods.length).toBeGreaterThan(0);
    });

    it('should handle relative imports', () => {
        const filePath = path.join(fixturesDir, 'sample.ts');
        const result = parser.parse(filePath);

        const relativeImport = result.imports.find((i: ImportInfo) => i.isRelative);
        expect(relativeImport).toBeDefined();
        expect(relativeImport?.resolvedPath).toBeDefined();
    });

    it('should detect dynamic imports', () => {
        const code = `const mod = import('./module');`;
        const result = parser.parse('test.ts', code);

        expect(result.imports).toHaveLength(1);
        expect(result.imports[0].module).toBe('./module');
        expect(result.imports[0].isDynamic).toBe(true);
        expect(result.imports[0].isRelative).toBe(true);
    });

    it('should detect require calls', () => {
        const code = `const mod = require('./module');`;
        const result = parser.parse('test.ts', code);

        expect(result.imports).toHaveLength(1);
        expect(result.imports[0].module).toBe('./module');
        expect(result.imports[0].isRequire).toBe(true);
        expect(result.imports[0].isRelative).toBe(true);
    });

    it('should detect both static and dynamic imports', () => {
        const code = `
            import { foo } from './static';
            const dynamic = import('./dynamic');
            const required = require('./required');
        `;
        const result = parser.parse('test.ts', code);

        expect(result.imports).toHaveLength(3);
        expect(result.imports.find(i => i.module === './static')).toBeDefined();
        expect(result.imports.find(i => i.isDynamic)).toBeDefined();
        expect(result.imports.find(i => i.isRequire)).toBeDefined();
    });
});

describe('JavaScriptParser', () => {
    const parser = new JavaScriptParser();
    const fixturesDir = path.join(__dirname, '../../../fixtures/parsers');

    it('should support .js files', () => {
        expect(parser.supports('test.js')).toBe(true);
        expect(parser.supports('test.jsx')).toBe(true);
        expect(parser.supports('test.ts')).toBe(false);
    });

    it('should extract imports from JS file', () => {
        const filePath = path.join(fixturesDir, 'sample.js');
        const result = parser.parse(filePath);

        expect(result.imports).toBeDefined();
        expect(result.imports.length).toBeGreaterThan(0);

        const reactImport = result.imports.find((i: ImportInfo) => i.module === 'react');
        expect(reactImport).toBeDefined();
    });

    it('should extract exports from JS file', () => {
        const filePath = path.join(fixturesDir, 'sample.js');
        const result = parser.parse(filePath);

        expect(result.exports).toBeDefined();
        expect(result.exports.length).toBeGreaterThan(0);
    });

    it('should extract functions from JS file', () => {
        const filePath = path.join(fixturesDir, 'sample.js');
        const result = parser.parse(filePath);

        expect(result.functions).toBeDefined();
        const validateFunc = result.functions.find((f: FunctionInfo) => f.name === 'validateEmail');
        expect(validateFunc).toBeDefined();
    });

    it('should extract classes from JS file', () => {
        const filePath = path.join(fixturesDir, 'sample.js');
        const result = parser.parse(filePath);

        expect(result.classes).toBeDefined();
        const dataService = result.classes.find((c: ClassInfo) => c.name === 'DataService');
        expect(dataService).toBeDefined();
    });
});

describe('ParserFactory', () => {
    it('should return TypeScript parser for .ts files', () => {
        const parser = ParserFactory.getParser('test.ts');
        expect(parser).toBeInstanceOf(TypeScriptParser);
    });

    it('should return JavaScript parser for .js files', () => {
        const parser = ParserFactory.getParser('test.js');
        expect(parser).toBeInstanceOf(JavaScriptParser);
    });

    it('should return null for unsupported files', () => {
        const parser = ParserFactory.getParser('test.py');
        expect(parser).toBeNull();
    });

    it('should correctly identify supported files', () => {
        expect(ParserFactory.isSupported('test.ts')).toBe(true);
        expect(ParserFactory.isSupported('test.js')).toBe(true);
        expect(ParserFactory.isSupported('test.py')).toBe(false);
    });
});
