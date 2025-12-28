import { IParser } from './types';
import { TypeScriptParser } from './typescript-parser';
import { JavaScriptParser } from './javascript-parser';

export class ParserFactory {
    private static parsers: IParser[] = [new TypeScriptParser(), new JavaScriptParser()];

    /**
     * Get appropriate parser for a file
     * @param filePath - File path to parse
     * @returns Parser instance or null if no parser supports the file
     */
    static getParser(filePath: string): IParser | null {
        for (const parser of this.parsers) {
            if (parser.supports(filePath)) {
                return parser;
            }
        }
        return null;
    }

    /**
     * Check if a file is supported
     * @param filePath - File path to check
     * @returns true if any parser supports this file
     */
    static isSupported(filePath: string): boolean {
        return this.getParser(filePath) !== null;
    }
}
