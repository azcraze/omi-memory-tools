// src/scripts/runWriteCategories.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { extractCategories } = require('../modules/extractCategories.js');
const { formatCategoriesMarkdown } = require('../utils/formatMarkdown.js');
const { writeJsonToCsv } = require('../utils/writeToCsv.js');
const { ValidationError, MemoryProcessingError, FileOperationError } = require('../utils/customErrors.js');

/**
 * runWriteCategories
 * Extracts category summaries from filtered memories and writes them to Markdown, JSON, and CSV files.
 */
async function runWriteCategories() {
  const filteredPath = path.join(__dirname, '..', 'data', 'filteredConversations.json');
  const outputDirMd = path.join(__dirname, '..', 'output', 'markdown');
  const outputDirJson = path.join(__dirname, '..', 'output', 'reports');
  const outputDirCsv = path.join(__dirname, '..', 'output', 'csv');
  const categoriesMdPath = path.join(outputDirMd, 'categoriesSummary.md');
  const categoriesJsonPath = path.join(outputDirJson, 'categoriesSummary.json');
  const categoriesCsvPath = path.join(outputDirCsv, 'categoriesSummary.csv');

  logger.info('runWriteCategories: Starting category summary writing process.');
  console.log('runWriteCategories: Starting category summary writing process.');

  try {
    // Step 1: Ensure output directories exist
    try {
      await Promise.all([
        fs.mkdir(outputDirMd, { recursive: true }),
        fs.mkdir(outputDirJson, { recursive: true }),
        fs.mkdir(outputDirCsv, { recursive: true })
      ]);
      logger.info(`runWriteCategories: Ensured output directories at ${outputDirMd}, ${outputDirJson}, and ${outputDirCsv}.`);
    } catch (mkdirError) {
      const errorMsg = `runWriteCategories: Failed to create output directories: ${mkdirError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 2: Read filteredConversations.json
    let rawData;
    try {
      rawData = await fs.readFile(filteredPath, 'utf-8');
      logger.info(`runWriteCategories: Successfully read filteredConversations.json from ${filteredPath}.`);
      console.log(`runWriteCategories: Successfully read filteredConversations.json from ${filteredPath}.`);
    } catch (readError) {
      const errorMsg = `runWriteCategories: Failed to read filteredConversations.json: ${readError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 3: Parse JSON data
    let activeMemories;
    try {
      activeMemories = JSON.parse(rawData);
      logger.info('runWriteCategories: Successfully parsed filteredConversations.json.');
      console.log('runWriteCategories: Successfully parsed filteredConversations.json.');
    } catch (parseError) {
      const errorMsg = `runWriteCategories: Failed to parse filteredConversations.json: ${parseError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 4: Validate that activeMemories is an array
    if (!Array.isArray(activeMemories)) {
      const errorMsg = 'runWriteCategories: Invalid data format - filteredConversations.json should contain an array.';
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 5: Extract categories
    let categoriesSummary;
    try {
      categoriesSummary = extractCategories(activeMemories);
      logger.info(`runWriteCategories: Extracted categories summary for ${categoriesSummary.length} categories.`);
      console.log(`runWriteCategories: Extracted categories summary for ${categoriesSummary.length} categories.`);
    } catch (extractError) {
      const errorMsg = `runWriteCategories: Failed to extract categories: ${extractError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new MemoryProcessingError(errorMsg);
    }

    // Step 6: Format categories to Markdown
    let categoriesMarkdown;
    try {
      categoriesMarkdown = formatCategoriesMarkdown(categoriesSummary);
      logger.info('runWriteCategories: Successfully formatted categories to Markdown.');
      console.log('runWriteCategories: Successfully formatted categories to Markdown.');
    } catch (formatError) {
      const errorMsg = `runWriteCategories: Failed to format categories to Markdown: ${formatError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new MemoryProcessingError(errorMsg);
    }

    // Step 7: Write categories to Markdown
    try {
      await fs.writeFile(categoriesMdPath, categoriesMarkdown, 'utf-8');
      logger.info(`runWriteCategories: Categories summary written to Markdown: ${categoriesMdPath}`);
      console.log(`runWriteCategories: Categories summary written to Markdown: ${categoriesMdPath}`);
    } catch (writeError) {
      const errorMsg = `runWriteCategories: Failed to write categoriesSummary.md: ${writeError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 8: Write categories to JSON
    try {
      await fs.writeFile(categoriesJsonPath, JSON.stringify(categoriesSummary, null, 2), 'utf-8');
      logger.info(`runWriteCategories: Categories summary written to JSON: ${categoriesJsonPath}`);
      console.log(`runWriteCategories: Categories summary written to JSON: ${categoriesJsonPath}`);
    } catch (writeError) {
      const errorMsg = `runWriteCategories: Failed to write categoriesSummary.json: ${writeError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 9: Write categories to CSV
    try {
      await writeJsonToCsv(categoriesSummary, ['category', 'count', 'emoji'], categoriesCsvPath);
      logger.info(`runWriteCategories: Categories summary written to CSV: ${categoriesCsvPath}`);
      console.log(`runWriteCategories: Categories summary written to CSV: ${categoriesCsvPath}`);
    } catch (csvError) {
      const errorMsg = `runWriteCategories: Failed to write categoriesSummary.csv: ${csvError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    logger.info('runWriteCategories: Category summary writing process completed successfully.');
    console.log('runWriteCategories: Category summary writing process completed successfully.');
  } catch (error) {
    logger.error(`runWriteCategories: Process failed - ${error.message}`);
    console.error(`runWriteCategories: Process failed - ${error.message}`);
    process.exit(1);
  }
}

// Execute the function if the script is run directly
if (require.main === module) {
  runWriteCategories()
    .then(() => {
      const completionMsg = 'runWriteCategories: Completed successfully.';
      logger.info(completionMsg);
      console.log(completionMsg);
    })
    .catch((err) => {
      const failureMsg = 'runWriteCategories: Encountered a failure.';
      logger.error(failureMsg);
      console.error(failureMsg);
      process.exit(1);
    });
}

module.exports = {
  runWriteCategories,
};
