// src/scripts/runWriteMarkdown.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { extractCategories } = require('../modules/extractCategories.js');
const { extractTranscriptSegments } = require('../modules/extractTranscriptSegments.js');
const { extractPluginResponses } = require('../modules/extractPluginResponses.js');
const { formatCategoriesMarkdown, formatTranscriptMarkdown } = require('../utils/formatMarkdown.js');
const { ValidationError, MemoryProcessingError, FileOperationError } = require('../utils/customErrors.js');

/**
 * runWriteMarkdown
 * Consolidates extracted data from filtered memories into a comprehensive Markdown report.
 */
async function runWriteMarkdown() {
  const filteredPath = path.join(__dirname, '..', 'data', 'filteredConversations.json');
  const outputDirMd = path.join(__dirname, '..', 'output', 'markdown');
  const markdownReportPath = path.join(outputDirMd, 'consolidatedReport.md');

  logger.info('runWriteMarkdown: Starting Markdown report writing process.');
  console.log('runWriteMarkdown: Starting Markdown report writing process.');

  try {
    // Step 1: Ensure Markdown output directory exists
    try {
      await fs.mkdir(outputDirMd, { recursive: true });
      logger.info(`runWriteMarkdown: Ensured Markdown output directory at ${outputDirMd}.`);
    } catch (mkdirError) {
      const errorMsg = `runWriteMarkdown: Failed to create Markdown output directory: ${mkdirError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 2: Read filteredConversations.json
    let rawData;
    try {
      rawData = await fs.readFile(filteredPath, 'utf-8');
      logger.info(`runWriteMarkdown: Successfully read filteredConversations.json from ${filteredPath}.`);
      console.log(`runWriteMarkdown: Successfully read filteredConversations.json from ${filteredPath}.`);
    } catch (readError) {
      const errorMsg = `runWriteMarkdown: Failed to read filteredConversations.json: ${readError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 3: Parse JSON data
    let activeMemories;
    try {
      activeMemories = JSON.parse(rawData);
      logger.info('runWriteMarkdown: Successfully parsed filteredConversations.json.');
      console.log('runWriteMarkdown: Successfully parsed filteredConversations.json.');
    } catch (parseError) {
      const errorMsg = `runWriteMarkdown: Failed to parse filteredConversations.json: ${parseError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 4: Validate that activeMemories is an array
    if (!Array.isArray(activeMemories)) {
      const errorMsg = 'runWriteMarkdown: Invalid data format - filteredConversations.json should contain an array.';
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 5: Extract categories, transcripts, and plugin responses
    let categoriesSummary, transcriptData, pluginResponses;
    try {
      categoriesSummary = extractCategories(activeMemories);
      logger.info(`runWriteMarkdown: Extracted categories summary for ${categoriesSummary.length} categories.`);
      console.log(`runWriteMarkdown: Extracted categories summary for ${categoriesSummary.length} categories.`);
    } catch (extractError) {
      const errorMsg = `runWriteMarkdown: Failed to extract categories: ${extractError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new MemoryProcessingError(errorMsg);
    }

    try {
      transcriptData = extractTranscriptSegments(activeMemories);
      logger.info(`runWriteMarkdown: Extracted transcript segments for ${transcriptData.length} memories.`);
      console.log(`runWriteMarkdown: Extracted transcript segments for ${transcriptData.length} memories.`);
    } catch (extractError) {
      const errorMsg = `runWriteMarkdown: Failed to extract transcript segments: ${extractError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new MemoryProcessingError(errorMsg);
    }

    try {
      pluginResponses = extractPluginResponses(activeMemories);
      logger.info(`runWriteMarkdown: Extracted plugin responses for ${pluginResponses.length} memories.`);
      console.log(`runWriteMarkdown: Extracted plugin responses for ${pluginResponses.length} memories.`);
    } catch (extractError) {
      const errorMsg = `runWriteMarkdown: Failed to extract plugin responses: ${extractError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new MemoryProcessingError(errorMsg);
    }

    // Step 6: Format data into Markdown
    let markdownContent = '# Memories Processing Toolbox Reports\n\n';

    try {
      // Format Categories
      markdownContent += formatCategoriesMarkdown(categoriesSummary);

      // Format Transcripts
      markdownContent += formatTranscriptMarkdown(transcriptData);

      // Format Plugin Responses
      markdownContent += '## Plugin Responses\n\n';
      pluginResponses.forEach(mem => {
        markdownContent += `### Memory ID: ${mem.memoryId}\n\n`;
        if (mem.plugins.length === 0) {
          markdownContent += '_No plugin responses available._\n\n';
        } else {
          mem.plugins.forEach(plugin => {
            markdownContent += `**${plugin.displayName}**: ${plugin.content}\n\n`;
          });
        }
      });

      logger.debug('runWriteMarkdown: Markdown content formatted successfully.');
    } catch (formatError) {
      const errorMsg = `runWriteMarkdown: Failed to format data into Markdown: ${formatError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new MemoryProcessingError(errorMsg);
    }

    // Step 7: Write Markdown content to file
    try {
      await fs.writeFile(markdownReportPath, markdownContent, 'utf-8');
      logger.info(`runWriteMarkdown: Consolidated Markdown report written to: ${markdownReportPath}`);
      console.log(`runWriteMarkdown: Consolidated Markdown report written to: ${markdownReportPath}`);
    } catch (writeError) {
      const errorMsg = `runWriteMarkdown: Failed to write consolidatedReport.md: ${writeError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    logger.info('runWriteMarkdown: Markdown report writing process completed successfully.');
    console.log('runWriteMarkdown: Markdown report writing process completed successfully.');
  } catch (error) {
    logger.error(`runWriteMarkdown: Process failed - ${error.message}`);
    console.error(`runWriteMarkdown: Process failed - ${error.message}`);
    process.exit(1);
  }
}

// Execute the function if the script is run directly
if (require.main === module) {
  runWriteMarkdown()
    .then(() => {
      const completionMsg = 'runWriteMarkdown: Completed successfully.';
      logger.info(completionMsg);
      console.log(completionMsg);
    })
    .catch((err) => {
      const failureMsg = 'runWriteMarkdown: Encountered a failure.';
      logger.error(failureMsg);
      console.error(failureMsg);
      process.exit(1);
    });
}

module.exports = {
  runWriteMarkdown,
};
