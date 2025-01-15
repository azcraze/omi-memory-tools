// src/scripts/runExtractPlugins.js


const fs = require('fs').promises;
const path = require('path');
const logger = require('@utils/logger.js');
const {
  extractPluginResponses
} = require('@modules/extractPluginResponses.js');
const {
  writeJsonToCsv
} = require('@utils/writeToCsv.js');
const {
  ValidationError,
  FileOperationError
} = require('@utils/customErrors.js');

/**
 * runExtractPlugins
 * Extracts plugin responses from filtered memories and writes them to JSON and CSV files.
 */
async function runExtractPlugins() {
  const filteredPath = path.join(__dirname, '..', 'data', 'filteredConversations.json');
  const outputDirJson = path.join(__dirname, '..', 'output', 'reports');
  const outputDirCsv = path.join(__dirname, '..', 'output', 'csv');
  const pluginsJsonPath = path.join(outputDirJson, 'pluginResponses.json');
  const pluginsCsvPath = path.join(outputDirCsv, 'pluginResponses.csv');

  logger.info('runExtractPlugins: Starting plugin extraction process.');
  console.log('runExtractPlugins: Starting plugin extraction process.');

  try {
    // Step 1: Ensure output directories exist
    try {
      await Promise.all([
        fs.mkdir(outputDirJson, {
          recursive: true
        }),
        fs.mkdir(outputDirCsv, {
          recursive: true
        })
      ]);
      logger.info(`runExtractPlugins: Ensured output directories at ${outputDirJson} and ${outputDirCsv}.`);
    } catch (mkdirError) {
      const errorMsg = `runExtractPlugins: Failed to create output directories: ${mkdirError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 2: Read filteredConversations.json
    let rawData;
    try {
      rawData = await fs.readFile(filteredPath, 'utf-8');
      logger.info(`runExtractPlugins: Successfully read filteredConversations.json from ${filteredPath}.`);
      console.log(`runExtractPlugins: Successfully read filteredConversations.json from ${filteredPath}.`);
    } catch (readError) {
      const errorMsg = `runExtractPlugins: Failed to read filteredConversations.json: ${readError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 3: Parse JSON data
    let activeMemories;
    try {
      activeMemories = JSON.parse(rawData);
      logger.info('runExtractPlugins: Successfully parsed filteredConversations.json.');
      console.log('runExtractPlugins: Successfully parsed filteredConversations.json.');
    } catch (parseError) {
      const errorMsg = `runExtractPlugins: Failed to parse filteredConversations.json: ${parseError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 4: Validate that activeMemories is an array
    if (!Array.isArray(activeMemories)) {
      const errorMsg = 'runExtractPlugins: Invalid data format - filteredConversations.json should contain an array.';
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 5: Extract plugin responses
    let pluginResponses;
    try {
      pluginResponses = extractPluginResponses(activeMemories);
      logger.info(`runExtractPlugins: Extracted plugin responses for ${pluginResponses.length} memories.`);
      console.log(`runExtractPlugins: Extracted plugin responses for ${pluginResponses.length} memories.`);
    } catch (extractError) {
      const errorMsg = `runExtractPlugins: Failed to extract plugin responses: ${extractError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 6: Write plugin responses to JSON
    try {
      await fs.writeFile(pluginsJsonPath, JSON.stringify(pluginResponses, null, 2), 'utf-8');
      logger.info(`runExtractPlugins: Plugin responses written to JSON: ${pluginsJsonPath}`);
      console.log(`runExtractPlugins: Plugin responses written to JSON: ${pluginsJsonPath}`);
    } catch (writeError) {
      const errorMsg = `runExtractPlugins: Failed to write pluginResponses.json: ${writeError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 7: Convert plugin responses to CSV data
    let pluginCsvData;
    try {
      const pluginFields = ['memoryId', 'pluginId', 'displayName', 'content'];
      pluginCsvData = pluginResponses.flatMap(mem =>
        mem.plugins.map(plugin => ({
          memoryId: mem.memoryId,
          pluginId: plugin.pluginId,
          displayName: plugin.displayName,
          content: plugin.content
        }))
      );
      logger.debug(`runExtractPlugins: Plugin CSV data prepared.`);
    } catch (convertError) {
      const errorMsg = `runExtractPlugins: Failed to convert plugin responses to CSV data: ${convertError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 8: Write plugin responses to CSV
    try {
      await writeJsonToCsv(pluginCsvData, ['memoryId', 'pluginId', 'displayName', 'content'], pluginsCsvPath);
      logger.info(`runExtractPlugins: Plugin responses written to CSV: ${pluginsCsvPath}`);
      console.log(`runExtractPlugins: Plugin responses written to CSV: ${pluginsCsvPath}`);
    } catch (csvError) {
      const errorMsg = `runExtractPlugins: Failed to write pluginResponses.csv: ${csvError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    logger.info('runExtractPlugins: Plugin extraction process completed successfully.');
    console.log('runExtractPlugins: Plugin extraction process completed successfully.');
  } catch (error) {
    logger.error(`runExtractPlugins: Process failed - ${error.message}`);
    console.error(`runExtractPlugins: Process failed - ${error.message}`);
    process.exit(1);
  }
}

// Execute the function if the script is run directly
if (require.main === module) {
  runExtractPlugins()
    .then(() => {
      const completionMsg = 'runExtractPlugins: Completed successfully.';
      logger.info(completionMsg);
      console.log(completionMsg);
    })
    .catch((err) => {
      const failureMsg = 'runExtractPlugins: Encountered a failure.';
      logger.error(failureMsg);
      console.error(failureMsg);
      process.exit(1);
    });
}

module.exports = {
  runExtractPlugins
};