// src/scripts/runWriteCsv.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { writeJsonToCsv } = require('../utils/writeToCsv.js');
const { extractCategories } = require('../modules/extractCategories.js');
const { extractTranscriptSegments } = require('../modules/extractTranscriptSegments.js');
const { extractPluginResponses } = require('../modules/extractPluginResponses.js');
const { ValidationError, MemoryProcessingError, FileOperationError } = require('../utils/customErrors.js');

/**
 * runWriteCsv
 * Converts extracted data from filtered memories into CSV format and writes to files.
 */
async function runWriteCsv() {
  const filteredPath = path.join(__dirname, '..', 'data', 'filteredConversations.json');
  const outputDirCsv = path.join(__dirname, '..', 'output', 'csv');
  const categoriesCsvPath = path.join(outputDirCsv, 'categoriesSummary.csv');
  const transcriptsCsvPath = path.join(outputDirCsv, 'transcripts.csv');
  const pluginsCsvPath = path.join(outputDirCsv, 'pluginResponses.csv');

  logger.info('runWriteCsv: Starting CSV writing process.');
  console.log('runWriteCsv: Starting CSV writing process.');

  try {
    // Step 1: Ensure CSV output directory exists
    try {
      await fs.mkdir(outputDirCsv, { recursive: true });
      logger.info(`runWriteCsv: Ensured CSV output directory at ${outputDirCsv}.`);
    } catch (mkdirError) {
      const errorMsg = `runWriteCsv: Failed to create CSV output directory: ${mkdirError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 2: Read filteredConversations.json
    let rawData;
    try {
      rawData = await fs.readFile(filteredPath, 'utf-8');
      logger.info(`runWriteCsv: Successfully read filteredConversations.json from ${filteredPath}.`);
      console.log(`runWriteCsv: Successfully read filteredConversations.json from ${filteredPath}.`);
    } catch (readError) {
      const errorMsg = `runWriteCsv: Failed to read filteredConversations.json: ${readError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 3: Parse JSON data
    let activeMemories;
    try {
      activeMemories = JSON.parse(rawData);
      logger.info('runWriteCsv: Successfully parsed filteredConversations.json.');
      console.log('runWriteCsv: Successfully parsed filteredConversations.json.');
    } catch (parseError) {
      const errorMsg = `runWriteCsv: Failed to parse filteredConversations.json: ${parseError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 4: Validate that activeMemories is an array
    if (!Array.isArray(activeMemories)) {
      const errorMsg = 'runWriteCsv: Invalid data format - filteredConversations.json should contain an array.';
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 5: Extract categories, transcripts, and plugin responses
    let categoriesSummary, transcriptData, pluginResponses;
    try {
      categoriesSummary = extractCategories(activeMemories);
      logger.info(`runWriteCsv: Extracted categories summary for ${categoriesSummary.length} categories.`);
      console.log(`runWriteCsv: Extracted categories summary for ${categoriesSummary.length} categories.`);
    } catch (extractError) {
      const errorMsg = `runWriteCsv: Failed to extract categories: ${extractError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new MemoryProcessingError(errorMsg);
    }

    try {
      transcriptData = extractTranscriptSegments(activeMemories);
      logger.info(`runWriteCsv: Extracted transcript segments for ${transcriptData.length} memories.`);
      console.log(`runWriteCsv: Extracted transcript segments for ${transcriptData.length} memories.`);
    } catch (extractError) {
      const errorMsg = `runWriteCsv: Failed to extract transcript segments: ${extractError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new MemoryProcessingError(errorMsg);
    }

    try {
      pluginResponses = extractPluginResponses(activeMemories);
      logger.info(`runWriteCsv: Extracted plugin responses for ${pluginResponses.length} memories.`);
      console.log(`runWriteCsv: Extracted plugin responses for ${pluginResponses.length} memories.`);
    } catch (extractError) {
      const errorMsg = `runWriteCsv: Failed to extract plugin responses: ${extractError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new MemoryProcessingError(errorMsg);
    }

    // Step 6: Prepare CSV data
    let flattenedTranscripts, flattenedPlugins;
    try {
      const transcriptFields = ['memoryId', 'text', 'speaker', 'speaker_id', 'is_user', 'start', 'end'];
      flattenedTranscripts = transcriptData.flatMap(mem =>
        mem.transcript.map(seg => ({
          memoryId: mem.memoryId,
          text: seg.text,
          speaker: seg.speaker,
          speaker_id: seg.speaker_id,
          is_user: seg.is_user,
          start: seg.start,
          end: seg.end,
        }))
      );
      logger.debug('runWriteCsv: Flattened transcript data prepared for CSV.');
    } catch (flattenError) {
      const errorMsg = `runWriteCsv: Failed to flatten transcript data: ${flattenError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    try {
      const pluginFields = ['memoryId', 'pluginId', 'displayName', 'content'];
      flattenedPlugins = pluginResponses.flatMap(mem =>
        mem.plugins.map(plugin => ({
          memoryId: mem.memoryId,
          pluginId: plugin.pluginId,
          displayName: plugin.displayName,
          content: plugin.content,
        }))
      );
      logger.debug('runWriteCsv: Flattened plugin data prepared for CSV.');
    } catch (flattenError) {
      const errorMsg = `runWriteCsv: Failed to flatten plugin data: ${flattenError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 7: Write categories to CSV
    try {
      await writeJsonToCsv(categoriesSummary, ['category', 'count', 'emoji'], categoriesCsvPath);
      logger.info(`runWriteCsv: Categories summary written to CSV: ${categoriesCsvPath}`);
      console.log(`runWriteCsv: Categories summary written to CSV: ${categoriesCsvPath}`);
    } catch (csvError) {
      const errorMsg = `runWriteCsv: Failed to write categoriesSummary.csv: ${csvError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 8: Write transcripts to CSV
    try {
      await writeJsonToCsv(flattenedTranscripts, ['memoryId', 'text', 'speaker', 'speaker_id', 'is_user', 'start', 'end'], transcriptsCsvPath);
      logger.info(`runWriteCsv: Transcripts written to CSV: ${transcriptsCsvPath}`);
      console.log(`runWriteCsv: Transcripts written to CSV: ${transcriptsCsvPath}`);
    } catch (csvError) {
      const errorMsg = `runWriteCsv: Failed to write transcripts.csv: ${csvError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 9: Write plugin responses to CSV
    try {
      await writeJsonToCsv(flattenedPlugins, ['memoryId', 'pluginId', 'displayName', 'content'], pluginsCsvPath);
      logger.info(`runWriteCsv: Plugin responses written to CSV: ${pluginsCsvPath}`);
      console.log(`runWriteCsv: Plugin responses written to CSV: ${pluginsCsvPath}`);
    } catch (csvError) {
      const errorMsg = `runWriteCsv: Failed to write pluginResponses.csv: ${csvError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    logger.info('runWriteCsv: CSV writing process completed successfully.');
    console.log('runWriteCsv: CSV writing process completed successfully.');
  } catch (error) {
    logger.error(`runWriteCsv: Process failed - ${error.message}`);
    console.error(`runWriteCsv: Process failed - ${error.message}`);
    process.exit(1);
  }
}

// Execute the function if the script is run directly
if (require.main === module) {
  runWriteCsv()
    .then(() => {
      const completionMsg = 'runWriteCsv: Completed successfully.';
      logger.info(completionMsg);
      console.log(completionMsg);
    })
    .catch((err) => {
      const failureMsg = 'runWriteCsv: Encountered a failure.';
      logger.error(failureMsg);
      console.error(failureMsg);
      process.exit(1);
    });
}

module.exports = {
  runWriteCsv,
};
