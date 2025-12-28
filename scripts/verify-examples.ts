
import { ValidateCommand } from '../src/cli/commands/validate-command';
import { RulesForCommand } from '../src/cli/commands/rules-for-command';
import * as path from 'path';

async function verifyExamples() {
    console.log('🧪 Starting Verification of REFACTORED Example Projects...\n');
    let failures = 0;
    const projectRoot = path.resolve(__dirname, '..');

    // 1. clean-architecture (Expect: SUCCESS)
    console.log('checking [clean-architecture] (Expect: SUCCESS)...');
    try {
        process.chdir(path.join(projectRoot, 'examples/clean-architecture'));
        const cmd = new ValidateCommand();
        await cmd.execute({ format: 'text' });
        console.log('✅ Passed as expected\n');
    } catch (e) {
        console.error('❌ FAILED:', e);
        failures++;
    }

    // 2. layer-violation (Expect: FAILURE)
    console.log('checking [layer-violation] (Expect: FAILURE)...');
    try {
        process.chdir(path.join(projectRoot, 'examples/layer-violation'));

        let exitCode = 0;
        const originalExit = process.exit;
        // @ts-ignore
        process.exit = (code) => { exitCode = code; };

        const cmd = new ValidateCommand();
        let output = '';
        const originalLog = console.log;
        console.log = (msg) => { output += msg + '\n'; originalLog(msg); };

        try { await cmd.execute({ format: 'text' }); } catch (e) { }

        // @ts-ignore
        process.exit = originalExit;
        console.log = originalLog;

        // Check for specific layer violation message or logic
        if (exitCode === 1 || output.includes('Violations found')) {
            console.log('✅ Failed as expected (Layer Violation)\n');
        } else {
            console.error('❌ FAILED: Should have reported violations.\n');
            failures++;
        }
    } catch (e) {
        console.error('❌ FAILED:', e);
        failures++;
    }

    // 3. protected-region (Expect: Protected)
    console.log('checking [protected-region] (Expect: Protected)...');
    try {
        process.chdir(path.join(projectRoot, 'examples/protected-region'));
        const cmd = new RulesForCommand();

        let jsonOutput = '';
        const originalLog = console.log;
        console.log = (msg) => { if (typeof msg === 'string' && msg.startsWith('{')) jsonOutput = msg; };

        await cmd.execute('src/core/types.ts');
        console.log = originalLog;

        const result = JSON.parse(jsonOutput || '{}');
        if (result.isProtected === true) {
            console.log('✅ Verified Protected Region\n');
        } else {
            console.error('❌ FAILED: File not reported as protected.\n');
            failures++;
        }
    } catch (e) {
        console.error('❌ FAILED:', e);
        failures++;
    }

    // 4. banned-deps (Expect: Banned Dep Warning)
    console.log('checking [banned-deps] (Expect: Banned Dep)...');
    try {
        process.chdir(path.join(projectRoot, 'examples/banned-deps'));
        const cmd = new RulesForCommand();

        let jsonOutput = '';
        const originalLog = console.log;
        console.log = (msg) => { if (typeof msg === 'string' && msg.startsWith('{')) jsonOutput = msg; };

        await cmd.execute('src/api/handler.ts');
        console.log = originalLog;

        const result = JSON.parse(jsonOutput || '{}');
        if (result.bannedDependencies && result.bannedDependencies.length > 0) {
            console.log('✅ Verified Banned Dependency\n');
        } else {
            console.error('❌ FAILED: No banned dependencies reported.\n');
            failures++;
        }
    } catch (e) {
        console.error('❌ FAILED:', e);
        failures++;
    }

    if (failures === 0) {
        console.log('🎉 All 4 examples verified successfully!');
        process.exit(0);
    } else {
        console.error(`💥 Verification finished with ${failures} failures.`);
        process.exit(1);
    }
}

verifyExamples();
