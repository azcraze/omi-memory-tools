// src/scripts/runFiltering.js

console.log('runFiltering.js has started.');

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { ValidationError } = require('../utils/customErrors.js');

/**
 * runFiltering
 * Filters out discarded/deleted memories from conversations.json without modifying the original file.
 * Outputs the filtered data to a separate file.
 */
async function runFiltering() {
  const conversationsPath = path.join(__dirname, '..', 'data', 'conversations.json');
  const filteredPath = path.join(__dirname, '..', 'data', 'filteredConversations.json');

  logger.info('Starting runFiltering...');
  console.log('Starting runFiltering...');

  try {
    // Step 1: Read conversations.json
    let rawData;
    try {
      rawData = await fs.readFile(conversationsPath, 'utf-8');
      logger.info(`Successfully read conversations.json from ${conversationsPath}`);
      console.log(`Successfully read conversations.json from ${conversationsPath}`);
    } catch (readError) {
      const errorMsg = `Failed to read conversations.json: ${readError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 2: Parse JSON data
    let allMemories;
    try {
      allMemories = JSON.parse(rawData);
      logger.info('Successfully parsed conversations.json');
      console.log('Successfully parsed conversations.json');
    } catch (parseError) {
      const errorMsg = `Failed to parse conversations.json: ${parseError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 3: Ensure data is an array
    if (!Array.isArray(allMemories)) {
      const errorMsg = 'Invalid data format: conversations.json should contain an array.';
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 4: Filter memories
    let filteredMemories;
    try {
      filteredMemories = filterNonDiscarded(allMemories);
      logger.info(`Filtered memories. Remaining memories: ${filteredMemories.length}`);
      console.log(`Filtered memories. Remaining memories: ${filteredMemories.length}`);
    } catch (filterError) {
      const errorMsg = `Filtering failed: ${filterError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 5: Write filtered memories to a separate file
    try {
      await fs.mkdir(path.dirname(filteredPath), { recursive: true });
      await fs.writeFile(filteredPath, JSON.stringify(filteredMemories, null, 2), 'utf-8');
      const successMsg = `Filtered memories written to: ${filteredPath}`;
      logger.info(successMsg);
      console.log(successMsg);
    } catch (writeError) {
      const errorMsg = `Failed to write filteredConversations.json: ${writeError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

  } catch (error) {
    logger.error(`runFiltering encountered an error: ${error.message}`);
    console.error(`runFiltering encountered an error: ${error.message}`);
    // Optionally, exit the process with a failure code
    process.exit(1);
  }
}

// Execute the function if the script is run directly
if (require.main === module) {
  runFiltering()
    .then(() => {
      const completionMsg = 'runFiltering completed successfully.';
      logger.info(completionMsg);
      console.log(completionMsg);
    })
    .catch((err) => {
      const failureMsg = 'runFiltering failed.';
      logger.error(failureMsg);
      console.error(failureMsg);
      process.exit(1);
    });
}

module.exports = {
  runFiltering,
};
