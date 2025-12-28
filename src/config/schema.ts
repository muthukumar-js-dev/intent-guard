import { IntentGuardConfig } from '../types';

/**
 * JSON Schema for intent.config.yaml validation
 */
export const CONFIG_SCHEMA = {
    type: 'object',
    required: ['version', 'architecture'],
    properties: {
        version: {
            type: 'string',
            pattern: '^\\d+\\.\\d+\\.\\d+$',
            description: 'Config version (semver format)',
        },
        architecture: {
            type: 'object',
            required: ['layers'],
            properties: {
                layers: {
                    type: 'array',
                    minItems: 1,
                    items: {
                        type: 'object',
                        required: ['name', 'path', 'canImportFrom'],
                        properties: {
                            name: {
                                type: 'string',
                                pattern: '^[a-z][a-z0-9-]*$',
                                description: 'Layer name (lowercase, alphanumeric with hyphens)',
                            },
                            path: {
                                type: 'string',
                                description: 'Glob pattern for layer files',
                            },
                            canImportFrom: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'List of layer names this layer can import from',
                            },
                            cannotImportFrom: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Explicit list of forbidden imports (optional)',
                            },
                        },
                    },
                },
            },
        },
        intents: {
            type: 'array',
            items: {
                type: 'object',
                required: ['id', 'description', 'location', 'mutable'],
                properties: {
                    id: {
                        type: 'string',
                        pattern: '^[a-z][a-z0-9-]*$',
                    },
                    description: { type: 'string' },
                    location: { type: 'string' },
                    mutable: { type: 'boolean' },
                    semanticHash: { type: 'string' },
                },
            },
        },
        protectedRegions: {
            type: 'array',
            items: {
                type: 'object',
                required: ['path', 'reason', 'aiMutable'],
                properties: {
                    path: { type: 'string' },
                    reason: { type: 'string' },
                    aiMutable: { type: 'boolean' },
                },
            },
        },
        bannedDependencies: {
            type: 'array',
            items: {
                type: 'object',
                required: ['reason'],
                properties: {
                    package: { type: 'string' },
                    pattern: { type: 'string' },
                    reason: { type: 'string' },
                    alternatives: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                },
            },
        },
    },
};

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<IntentGuardConfig> = {
    version: '1.0.0',
    intents: [],
    protectedRegions: [],
    bannedDependencies: [],
};
