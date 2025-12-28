import chalk from 'chalk';

export class CLIError extends Error {
    constructor(
        message: string,
        public readonly suggestion?: string,
        public readonly exitCode: number = 1
    ) {
        super(message);
        this.name = 'CLIError';
    }
}

export class ErrorHandler {
    /**
     * Handle errors gracefully with user-friendly messages
     */
    static handle(error: unknown): never {
        const isDebug = process.env.DEBUG === '1' || process.env.DEBUG === 'true';

        if (error instanceof CLIError) {
            // User-facing error with suggestion
            console.error(chalk.red(`✗ Error: ${error.message}`));
            if (error.suggestion) {
                console.error(chalk.yellow(`  ${error.suggestion}`));
            }
            if (isDebug) {
                console.error(chalk.gray(`\nStack trace:\n${error.stack}`));
            }
            process.exit(error.exitCode);
        } else if (error instanceof Error) {
            // Unexpected error
            console.error(chalk.red(`✗ Unexpected error: ${error.message}`));

            if (isDebug) {
                console.error(chalk.gray(`\nStack trace:\n${error.stack}`));
            } else {
                console.error(
                    chalk.yellow(`\nFor more details, run with: DEBUG=1 npx intent-guard <command>`)
                );
            }

            process.exit(1);
        } else {
            // Unknown error type
            console.error(chalk.red(`✗ Unknown error occurred`));
            console.error(error);
            process.exit(1);
        }
    }

    /**
     * Wrap async function with error handling
     */
    static async wrap<T>(fn: () => Promise<T>): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            this.handle(error);
        }
    }
}
