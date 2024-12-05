#!/usr/bin/env node

import { execSync } from 'child_process';
import { register } from 'ts-node';
import fs from 'fs-extra';
import path from 'path';

async function runAll(): Promise<void> {
    // Default paths for translation file and output JSON directory
    const defaultTranslationPath = 'src/translations/index.ts'; // Updated for index.ts
    const defaultLocalesDir = 'public/locales';

    // Read paths from environment variables or fallback to defaults
    const translationPath = process.env.TRANSLATIONS_INPUT_FILE || defaultTranslationPath;
    const localesOutputDirectory = process.env.LOCALES_OUTPUT_DIRECTORY || path.resolve(process.cwd(), defaultLocalesDir);

    // Temporary directory and file path
    const tempDir = path.resolve(process.cwd(), '.temp');
    const tempFilePath = path.resolve(tempDir, path.basename(translationPath, '.ts') + '.js');

    try {
        // Validate input path
        if (!fs.existsSync(translationPath)) {
            throw new Error(`Translation file not found: ${translationPath}`);
        }

        // Ensure the output directory exists
        if (!fs.existsSync(localesOutputDirectory)) {
            fs.mkdirsSync(localesOutputDirectory);
        }

        // Logging paths for clarity
        console.log(`🚀 Starting Translations-to-Locales JSON Conversion Process...`);
        console.log(`📥 Input Translations File (TypeScript): ${translationPath}`);
        console.log(`📂 Locales Output Directory: ${localesOutputDirectory}`);

        // Step 1: Pre-generate the JavaScript file from the TypeScript file
        console.log(`🛠️ Compiling TypeScript translation file...`);
        execSync(`tsc ${translationPath} --outDir ${tempDir}`, {
            stdio: 'inherit', // Display compilation output
        });

        // Step 2: Register ts-node for TypeScript support
        register({
            project: path.resolve(process.cwd(), 'tsconfig.json'),
        });

        // Step 3: Dynamically import the generated JavaScript file
        console.log(`🔄 Loading translation configuration...`);
        let { locales, translations } = await import(tempFilePath);

        // Step 4: Validate the locales array
        if (!Array.isArray(locales) || locales.length === 0) {
            console.warn(`⚠️ Warning: Locales array is empty or invalid. Defaulting to ['en-us'].`);
            locales = ['en-us'];
        }

        // Step 5: Write the translations content to locale-specific files
        for (const locale of locales) {
            const outputFilePath = path.resolve(localesOutputDirectory, `${locale}.json`);
            await fs.outputJson(outputFilePath, translations, { spaces: 2 });
            console.log(`✅ Locale file generated: ${outputFilePath}`);
        }

        console.log(`✅ All locale files generated successfully!`);
    } catch (error) {
        console.error(`❌ An error occurred during the conversion process:`, error instanceof Error ? error.message : error);
        process.exit(1); // Exit with error code
    } finally {
        // Cleanup temporary files
        console.log(`🧹 Cleaning up temporary files...`);
        fs.removeSync(tempDir);
        console.log(`✅ Temporary files cleaned.`);
    }
}

// Entry point: run the function if this file is executed directly
if (require.main === module) {
    runAll();
}