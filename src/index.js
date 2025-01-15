// src/index.js
require('module-alias/register');

const {
    ensureDirectories,
    readJson,
    writeJson,
    writeMarkdown,
    writeCsv
} = require('@modules/fileOperations');
const config = require('@config');
const {
    loadSchema,
    validateData
} = require('@modules/validation');
/*
const {
    analyzeSentiment,
    extractKeywords
} = require('@modules/textProcessing');
const {
    generateMarkdownReport,
    displayAnalysisTable
} = require('@modules/reportGenerator');
*/
const logger = require('@logger');


// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise} - reason: ${reason}`);
    // Optionally exit the process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    // Optionally exit the process
    process.exit(1);
});


async function main() {
    try {
        // Load JSON schema
        await loadSchema();

        // Read conversations.json
        const conversations = await readJson();

        // Validate data
        const validation = validateData(conversations);
        if (!validation.isValid) {
            logger.error('Data validation failed. Exiting.');
            return;
        }

        // Proceed with further processing...
        await writeJson(`${config.dirs.json}/valid_memories.json`, conversations);

        logger.info('All operations completed successfully.');
    } catch (error) {
        logger.error(`An error occurred in main: ${error.message}`);
    }
}

main();

/**
 * Main entry point for the sentiment analysis tool.
 *
 * This function performs the following operations in order:
 * 1. Ensures all necessary directories exist.
 * 2. Loads the JSON schema for conversations.json.
 * 3. Reads conversations.json into memory.
 * 4. Validates the data against the JSON schema.
 * 5. Performs text analysis on each memory's transcript.
 * 6. Writes analysis results to analysis_results.json.
 * 7. Generates a Markdown report of the analysis results.
 * 8. Displays an analysis table in the CLI.
 *
 * If any step fails, the function will log the error and exit.
 
async function main() {
    try {
        // Ensure all necessary directories exist
        await ensureDirectories();

        // Load JSON schema
        await loadSchema();

        // Read conversations.json
        const conversations = await readJson();

        // Validate data
        const validation = validateData(conversations);
        if (!validation.isValid) {
            logger.error('Data validation failed. Exiting.');
            return;
        }

        // Perform text analysis on each memory's transcript
        const analysisResults = conversations.map(memory => {
            const fullTranscript = memory.transcript_segments.map(segment => segment.text).join(' ');
            const sentimentResult = analyzeSentiment(fullTranscript);
            const keywords = extractKeywords(fullTranscript);
            return {
                id: memory.id,
                sentiment: sentimentResult,
                keywords: keywords,
            };
        });

        // Write analysis results to JSON
        await writeJson('analysis_results.json', analysisResults);

        // Generate Markdown report
        await generateMarkdownReport(analysisResults, 'summary_stats.md');

        // Display analysis table in CLI
        displayAnalysisTable(analysisResults);

        logger.info('All operations completed successfully.');
    } catch (error) {
        logger.error(`An error occurred in main: ${error.message}`);
    }
}

main();
*/