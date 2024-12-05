#!/usr/bin/env node

import { register } from 'ts-node';
import fs from 'fs-extra';
import path from 'path';

export async function processTranslations(
    translationInputFile: string,
    localesOutputDirectory: string,
    tempDir: string
): Promise<void> {
    const relativePath = path.relative('src', path.dirname(translationInputFile));
    const tempTranslationsDir = path.resolve(tempDir, relativePath);
    const tempFilePath = path.resolve(tempTranslationsDir, path.basename(translationInputFile, '.ts') + '.js');

    try {
        console.log(`🛠️  Starting Translation Processing...`);
        console.log(`📥 Input File: ${translationInputFile}`);
        console.log(`📂 Output Directory: ${localesOutputDirectory}`);
        console.log(`🔧 Temp File Path: ${tempFilePath}`);

        // Ensure the translation input file exists
        if (!fs.existsSync(translationInputFile)) {
            throw new Error(`❌ Translation file not found: ${translationInputFile}`);
        }

        // Ensure the output directory exists
        if (!fs.existsSync(localesOutputDirectory)) {
            fs.mkdirsSync(localesOutputDirectory);
        }

        // Compile the TypeScript file
        console.log(`🛠️  Compiling TypeScript file...`);
        require('child_process').execSync(`npx tsc ${translationInputFile} --outDir ${tempDir}`, {
            stdio: 'inherit',
        });

        // Verify the temp file exists
        if (!fs.existsSync(tempFilePath)) {
            console.log(`❌ Temp file not found: ${tempFilePath}`);
            console.log(`🔍 Debug: Temp directory contents:`);
            if (fs.existsSync(tempDir)) {
                const tempFiles = fs.readdirSync(tempDir);
                tempFiles.forEach(file => console.log(`  - ${file}`));
            } else {
                console.log(`⚠️ Temp directory does not exist.`);
            }
            throw new Error(`❌ Compiled temp file not found: ${tempFilePath}`);
        }

        // Register ts-node for TypeScript imports
        register({
            project: path.resolve(process.cwd(), 'tsconfig.json'),
        });

        // Dynamically import the generated JavaScript file
        console.log(`🔄 Loading translation configuration from: ${tempFilePath}`);
        let { locales, translations } = await import(tempFilePath);

        // Validate locales array
        if (!Array.isArray(locales) || locales.length === 0) {
            console.warn(`⚠️ Warning: Locales array is empty or invalid. Defaulting to ['en-us'].`);
            locales = ['en-us'];
        }

        // Generate JSON files for each locale
        for (const locale of locales) {
            const localeFileContent = translations.map((translation: Record<string, string>) => ({
                Key: translation.key,
                Value: translation[locale],
            }));

            const outputFilePath = path.resolve(localesOutputDirectory, `${locale}.json`);
            await fs.outputJson(outputFilePath, localeFileContent, { spaces: 2 });
            console.log(`✅ Locale file generated: ${outputFilePath}`);
        }

        console.log(`✅ All locale files generated successfully!`);
    } catch (error) {
        console.error(`❌ Error during processing:`, error instanceof Error ? error.message : error);

        // Debug temp directory contents if an error occurs
        console.log(`🔍 Debug: Temp directory contents:`);
        if (fs.existsSync(tempDir)) {
            const tempFiles = fs.readdirSync(tempDir);
            tempFiles.forEach(file => console.log(`  - ${file}`));
        } else {
            console.log(`⚠️ Temp directory does not exist.`);
        }
        throw error;
    } finally {
        console.log(`🧹 Cleaning up temporary files...`);
        if (fs.existsSync(tempDir)) {
            fs.removeSync(tempDir);
            console.log(`✅ Temporary files cleaned.`);
        } else {
            console.log(`⚠️ Temp directory already cleaned or missing.`);
        }
    }
}