// Mock chalk to avoid ESM import issues
jest.mock('chalk', () => ({
  default: {
    red: (str: string) => str,
    green: (str: string) => str,
    cyan: (str: string) => str,
    yellow: (str: string) => str,
    gray: (str: string) => str,
    bold: (str: string) => str,
    underline: (str: string) => str,
  },
  red: (str: string) => str,
  green: (str: string) => str,
  cyan: (str: string) => str,
  yellow: (str: string) => str,
  gray: (str: string) => str,
  bold: (str: string) => str,
  underline: (str: string) => str,
}));

import { RulesForCommand } from '../../../src/cli/commands/rules-for-command';
import { ConfigLoader } from '../../../src/config/loader';
import * as fs from 'fs';
import * as path from 'path';

describe('Rules-For Command - Integration Tests', () => {
  const testDir = path.join(__dirname, 'test-rules-for-integration');
  let mockExit: jest.SpyInstance;
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
  });

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore
      }
    }
    fs.mkdirSync(testDir, { recursive: true });

    // Create dummy package.json
    fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify({
      name: 'test-project',
      version: '1.0.0'
    }));

    // Mock process.exit
    mockExit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      // console.error(`process.exit called with ${code}`);
      throw new Error(`process.exit: ${code}`);
    }) as any);
  });

  afterEach(() => {
    // Clear config cache to ensure clean state
    ConfigLoader.clearCache();

    // Restore CWD first
    try {
      if (process.cwd() !== originalCwd) {
        process.chdir(originalCwd);
      }
    } catch (e) {
      console.error('Failed to restore CWD:', e);
    }

    mockExit.mockRestore();
    // Then clean up
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore
      }
    }
    jest.restoreAllMocks();
  });

  it('should return rules for file in layer', async () => {
    // Create test project
    const srcDir = path.join(testDir, 'src');
    const domainDir = path.join(srcDir, 'domain');
    fs.mkdirSync(domainDir, { recursive: true });

    // Create config
    const configDir = path.join(testDir, '.intentguard');
    fs.mkdirSync(configDir, { recursive: true });

    const config = `version: "1.0.0"
architecture:
  layers:
    - name: domain
      path: src/domain/**
      canImportFrom: []
`;
    fs.writeFileSync(path.join(configDir, 'intent.config.yaml'), config);

    // Create test file
    const testFile = path.join(domainDir, 'user.ts');
    fs.writeFileSync(testFile, 'export class User {}');

    process.chdir(testDir);
    expect(process.cwd()).toBe(testDir);

    const mockLog = jest.spyOn(console, 'log').mockImplementation();

    const cmd = new RulesForCommand();
    try {
      // Pass relative path as CLI user would
      await cmd.execute('src/domain/user.ts');
    } catch (e) {
      console.error('Error in rules-for test 1:', e);
      throw e;
    }

    expect(mockLog).toHaveBeenCalled();
    // console.log('DEBUG: mockLog calls:', mockLog.mock.calls.length);
    if (mockLog.mock.calls.length === 0) {
      throw new Error('RulesForCommand did not output JSON (console.log was not called)');
    }
    const output = mockLog.mock.calls[0][0];
    // console.log('DEBUG OUTPUT 1:', output);

    const result = JSON.parse(output);
    if (result.layer !== 'domain') {
      console.error('FAILURE DEBUG: Expected domain, got:', result.layer);
      console.error('FULL RESULT:', JSON.stringify(result, null, 2));
    }
    expect(result.layer).toBe('domain');
    expect(result.canImportFrom).toEqual([]);
    expect(result.isProtected).toBe(false);
  });

  it('should detect protected regions', async () => {
    // Create test project
    const srcDir = path.join(testDir, 'src');
    const typesDir = path.join(srcDir, 'types');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.writeFileSync(path.join(typesDir, 'index.ts'), '// types');

    // Create config with protected region
    const configDir = path.join(testDir, '.intentguard');
    fs.mkdirSync(configDir, { recursive: true });

    const config = `version: "1.0.0"
architecture:
  layers:
    - name: dummy
      path: src/dummy/**
      canImportFrom: []
protectedRegions:
  - path: src/types/**
    reason: Core types
    aiMutable: false
`;
    fs.writeFileSync(path.join(configDir, 'intent.config.yaml'), config);

    process.chdir(testDir);

    const mockLog = jest.spyOn(console, 'log').mockImplementation();

    const cmd = new RulesForCommand();
    try {
      await cmd.execute('src/types/index.ts');
    } catch (e) {
      console.error('Error in rules-for test 2:', e);
      throw e;
    }

    const output = mockLog.mock.calls[0][0];
    const result = JSON.parse(output);

    expect(result.isProtected).toBe(true);
    expect(result.protectedReason).toBe('Core types');
  });

  it('should handle files not in any layer', async () => {
    // Create project structure
    const srcDir = path.join(testDir, 'src', 'other');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'file.ts'), '// other');

    // Create minimal config
    const configDir = path.join(testDir, '.intentguard');
    fs.mkdirSync(configDir, { recursive: true });

    const config = `version: "1.0.0"
architecture:
  layers:
    - name: domain
      path: src/domain/**
      canImportFrom: []
`;
    fs.writeFileSync(path.join(configDir, 'intent.config.yaml'), config);

    process.chdir(testDir);

    const mockLog = jest.spyOn(console, 'log').mockImplementation();

    const cmd = new RulesForCommand();
    await cmd.execute('src/other/file.ts');

    const output = mockLog.mock.calls[0][0];
    const result = JSON.parse(output);

    expect(result.layer).toBeUndefined();
    expect(result.isProtected).toBe(false);
  });

  it('should include banned dependencies in output', async () => {
    // Create project structure
    const srcDir = path.join(testDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'app.ts'), 'import _ from "lodash";');

    // Create config with banned dependencies
    const configDir = path.join(testDir, '.intentguard');
    fs.mkdirSync(configDir, { recursive: true });

    const config = `version: "1.0.0"
architecture:
  layers:
    - name: dummy
      path: src/dummy/**
      canImportFrom: []
bannedDependencies:
  - package: lodash
    reason: Use native methods
    alternatives: [ES6+]
`;
    fs.writeFileSync(path.join(configDir, 'intent.config.yaml'), config);

    process.chdir(testDir);

    const mockLog = jest.spyOn(console, 'log').mockImplementation();

    const cmd = new RulesForCommand();
    await cmd.execute('src/app.ts');

    const output = mockLog.mock.calls[0][0];
    const result = JSON.parse(output);

    expect(result.bannedDependencies).toHaveLength(1);
    expect(result.bannedDependencies[0].package).toBe('lodash');
    expect(result.bannedDependencies[0].alternatives).toEqual(['ES6+']);
  });
});
