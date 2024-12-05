#!/usr/bin/env node

import { execSync } from 'child_process';
import { register } from 'ts-node';
import fs from 'fs-extra';
import path from 'path';

async function runAll(): Promise<void> {
    try {
        // Default paths for translation file and output JSON file
        const defaultTranslationPath = 'src/translations/translation.config.ts';
        const defaultOutputFile = 'public/locales/converted.json';

        // Read paths from environment variables or fallback to defaults
        const translationPath = process.env.TRANSLATION_PATH || defaultTranslationPath;
        const outputFile = process.env.OUTPUT_FILE || path.resolve(process.cwd(), defaultOutputFile);

        // Temporary directory and file path
        const tempDir = path.resolve(process.cwd(), '.temp');
        const tempFilePath = path.resolve(tempDir, path.basename(translationPath, '.ts') + '.js');

        // Logging paths for clarity
        console.log(`Using translation file: ${translationPath}`);
        console.log(`Temporary file path: ${tempFilePath}`);
        console.log(`Output JSON file: ${outputFile}`);

        // Step 1: Pre-generate the JavaScript file from the TypeScript file
        console.log('Compiling TypeScript translation file...');
        execSync(`tsc ${translationPath} --outDir ${tempDir}`, {
            stdio: 'inherit', // Display compilation output
        });

        // Step 2: Register ts-node for TypeScript support
        register({
            project: path.resolve(process.cwd(), 'tsconfig.json'),
        });

        // Step 3: Dynamically import the generated JavaScript file
        console.log('Generating JSON...');
        const { tsObjectArray } = await import(tempFilePath);

        // Step 4: Write the JSON file to the specified output path
        await fs.outputJson(outputFile, tsObjectArray, { spaces: 2 });
        console.log(`JSON conversion completed. Output written to: ${outputFile}`);

        // Step 5: Cleanup temporary files
        console.log('Cleaning up temporary files...');
        fs.removeSync(tempDir);
        console.log('Temporary files cleaned.');
    } catch (error) {
        console.error('An error occurred during conversion:', error instanceof Error ? error.message : error);
        process.exit(1); // Exit with error code
    }
}

// Entry point: run the function if this file is executed directly
if (require.main === module) {
    runAll();
}