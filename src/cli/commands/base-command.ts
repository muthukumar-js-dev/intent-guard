import { ConfigLoader } from '../../config';
import { IntentGuardConfig } from '../../types';
import { CLIError } from '../error-handler';

export abstract class BaseCommand {
    protected config?: IntentGuardConfig;
    protected projectRoot?: string;

    protected loadConfig(): void {
        try {
            this.config = ConfigLoader.load();
            this.projectRoot = ConfigLoader.findProjectRoot() || process.cwd();
        } catch (error: any) {
            if (error.message && error.message.includes('not found')) {
                throw new CLIError(
                    'Configuration file not found',
                    "Run 'npx intent-guard init' to create configuration"
                );
            }
            throw error;
        }
    }

    abstract execute(...args: any[]): Promise<void>;
}
