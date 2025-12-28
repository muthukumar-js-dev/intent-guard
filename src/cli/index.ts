#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION } from '../index';
import { InitCommand } from './commands/init-command';
import { ValidateCommand } from './commands/validate-command';
import { RulesForCommand } from './commands/rules-for-command';
import { ErrorHandler } from './error-handler';

const program = new Command();

program
    .name('intent-guard')
    .description('Deterministic architectural controller for AI-generated code')
    .version(VERSION);

// Init command
program
    .command('init')
    .description('Initialize Intent-Guard in the current project')
    .action(async () => {
        await ErrorHandler.wrap(async () => {
            const cmd = new InitCommand();
            await cmd.execute();
        });
    });

// Validate command
program
    .command('validate')
    .description('Validate codebase against architectural rules')
    .option('-f, --format <format>', 'Output format (json|text)', 'text')
    .option('-d, --diff', 'Validate only changed files (git diff)', false)
    .option('-b, --baseline', 'Reset architectural baseline', false)
    .action(async (options) => {
        await ErrorHandler.wrap(async () => {
            const cmd = new ValidateCommand();
            await cmd.execute(options);
        });
    });

// Rules-for command
program
    .command('rules-for <file>')
    .description('Get architectural rules for a specific file (JITC support)')
    .action(async (file) => {
        await ErrorHandler.wrap(async () => {
            const cmd = new RulesForCommand();
            await cmd.execute(file);
        });
    });

// Global error handler for uncaught errors
process.on('uncaughtException', (error) => {
    ErrorHandler.handle(error);
});

process.on('unhandledRejection', (reason) => {
    ErrorHandler.handle(reason);
});

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
