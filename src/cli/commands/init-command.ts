import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { BaseCommand } from './base-command';

export class InitCommand extends BaseCommand {
    async execute(): Promise<void> {
        const configDir = path.join(process.cwd(), '.intentguard');
        const configFile = path.join(configDir, 'intent.config.yaml');

        // Check if config already exists
        if (fs.existsSync(configFile)) {
            console.log(chalk.yellow('⚠️  Configuration already exists at .intentguard/intent.config.yaml'));
            console.log(chalk.yellow('   Delete it first if you want to reinitialize.'));
            return;
        }

        // Create .intentguard directory
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        // Create default config
        const defaultConfig = `version: "1.0.0"

architecture:
  layers:
    - name: presentation
      path: src/presentation/**
      canImportFrom: [domain, infrastructure]
    
    - name: domain
      path: src/domain/**
      canImportFrom: []
    
    - name: infrastructure
      path: src/infrastructure/**
      canImportFrom: [domain]

# Optional: Define protected regions
protectedRegions: []

# Optional: Define banned dependencies
bannedDependencies: []
`;

        fs.writeFileSync(configFile, defaultConfig);

        // Create .gitignore entry for memory.json
        const gitignorePath = path.join(configDir, '.gitignore');
        fs.writeFileSync(gitignorePath, 'memory.json\n');

        console.log(chalk.green('✨ Intent-Guard initialized!\n'));
        console.log('Created:');
        console.log(chalk.cyan('  .intentguard/'));
        console.log(chalk.cyan('    intent.config.yaml') + '  (architecture contracts)');
        console.log(chalk.cyan('    .gitignore') + '          (excludes memory.json)\n');
        console.log('Next steps:');
        console.log('  1. Edit .intentguard/intent.config.yaml to define your architecture');
        console.log('  2. Run: ' + chalk.cyan('npx intent-guard validate'));
        console.log('  3. Add to package.json scripts:');
        console.log(chalk.gray('     "validate:intent": "intent-guard validate"'));
    }
}
