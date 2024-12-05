import { register } from 'ts-node';
import fs from 'fs-extra';
import path from 'path';

export async function processTranslations(
    translationInputFile: string,
    localesOutputDirectory: string,
    tempDir: string
): Promise<void> {
    const tempFilePath = path.resolve(
        tempDir,
        path.relative('src', path.dirname(translationInputFile)), // Adjust path relative to "src"
        path.basename(translationInputFile, '.ts') + '.js'
    );

    try {
        // Validate input path
        if (!fs.existsSync(translationInputFile)) {
            throw new Error(`Translation file not found: ${translationInputFile}`);
        }

        // Ensure the output directory exists
        if (!fs.existsSync(localesOutputDirectory)) {
            fs.mkdirsSync(localesOutputDirectory);
        }

        // Pre-generate the JavaScript file from the TypeScript file
        console.log(`🛠️  Compiling Translation file...`);
        require('child_process').execSync(`npx tsc ${translationInputFile} --outDir ${tempDir}`, {
            stdio: 'inherit', // Display compilation output
        });

        console.log('🔧 Temp file path:', tempFilePath);

        // Ensure the temp file exists before importing
        if (!fs.existsSync(tempFilePath)) {
            throw new Error(`❌ Compiled temp file not found: ${tempFilePath}`);
        }

        // Register ts-node for TypeScript support
        register({
            project: path.resolve(process.cwd(), 'tsconfig.json'),
        });

        // Dynamically import the generated JavaScript file
        console.log(`🔄 Loading translation configuration from: ${tempFilePath}`);
        let { locales, translations } = await import(tempFilePath);

        // Validate the locales array
        if (!Array.isArray(locales) || locales.length === 0) {
            console.warn(`⚠️ Warning: Locales array is empty or invalid. Defaulting to ['en-us'].`);
            locales = ['en-us'];
        }

        // Write the translations content to locale-specific files
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
        throw error; // Re-throw the error to ensure it is handled properly
    } finally {
        // Cleanup temporary files
        console.log(`🧹 Cleaning up temporary files...`);
        if (fs.existsSync(tempDir)) {
            fs.removeSync(tempDir);
            console.log(`✅ Temporary files cleaned.`);
        } else {
            console.log(`⚠️ Temp directory already cleaned or missing.`);
        }
    }
}