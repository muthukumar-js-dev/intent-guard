// Quick test script to verify non-git directory handling
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'temp-test-no-git');

try {
    // Create temp directory
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
    }

    console.log('Testing --diff mode in non-git directory...');
    
    try {
        execSync('npx intent-guard validate --diff', {
            cwd: testDir,
            stdio: 'pipe',
            encoding: 'utf-8'
        });
        console.log('❌ FAILED: Should have shown error for non-git directory');
    } catch (error) {
        const output = error.stderr || error.stdout || '';
        if (output.includes('requires a git repository') && output.includes('git init')) {
            console.log('✅ PASSED: Correct error message shown');
            console.log('Error message:', output.trim());
        } else {
            console.log('❌ FAILED: Wrong error message');
            console.log('Output:', output);
        }
    }
} finally {
    // Cleanup
    if (fs.existsSync(testDir)) {
        fs.rmdirSync(testDir, { recursive: true });
    }
}
