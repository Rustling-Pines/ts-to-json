import { register } from 'ts-node';
import fs from 'fs-extra';
import path from 'path';

async function convertTsToJson(): Promise<void> {
    try {
        // Register ts-node to handle TypeScript files
        register({
            project: path.resolve(process.cwd(), 'tsconfig.json'), // Optional: specify a tsconfig.json
        });

        // Resolve the path to the TypeScript file
        const inputFilePath = path.resolve(process.cwd(), 'src/conversions/ts_object_array.ts');

        // Ensure the file exists
        if (!fs.existsSync(inputFilePath)) {
            console.error('Input file not found:', inputFilePath);
            process.exit(1);
        }

        // Dynamically import the TypeScript file
        const { tsObjectArray } = require(inputFilePath);

        // Resolve the output file path
        const outputFilePath = path.resolve(process.cwd(), 'public/converted.json');

        // Write the filtered array to a JSON file
        await fs.outputJson(outputFilePath, tsObjectArray, { spaces: 2 });
        console.log('JSON conversion completed. Output written to:', outputFilePath);
    } catch (error) {
        console.error('An error occurred during conversion:', (error as Error).message);
        process.exit(1);
    }
}

export default convertTsToJson;

// If the file is executed directly, run the function
if (require.main === module) {
    convertTsToJson();
}