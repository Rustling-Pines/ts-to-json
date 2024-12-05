#!/usr/bin/env node
import { execSync } from 'child_process';
import { register } from 'ts-node';
import fs from 'fs-extra';
import path from 'path';

async function runAll(): Promise<void> {
    try {
        const tempDir = path.resolve(process.cwd(), 'temp');
        const inputFile = path.resolve(tempDir, 'ts_object_array.js');
        const outputFile = path.resolve(process.cwd(), 'public/converted.json');

        // Step 1: Pre-generate the JavaScript file
        console.log('Compiling TypeScript file...');
        execSync(`tsc src/conversions/ts_object_array.ts --outDir ${tempDir}`, {
            stdio: 'inherit',
        });

        // Step 2: Register ts-node for TypeScript support
        register({
            project: path.resolve(process.cwd(), 'tsconfig.json'),
        });

        // Step 3: Dynamically import the generated JavaScript file
        console.log('Generating JSON...');
        const { tsObjectArray } = await import(inputFile);

        // Step 4: Write the JSON file
        await fs.outputJson(outputFile, tsObjectArray, { spaces: 2 });
        console.log(`JSON conversion completed. Output written to: ${outputFile}`);

        // Step 5: Cleanup temporary files
        console.log('Cleaning up temporary files...');
        fs.removeSync(tempDir);
        console.log('Temporary files cleaned.');
    } catch (error) {
        console.error('An error occurred:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

if (require.main === module) {
    runAll();
}