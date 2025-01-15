// src/scripts/runValidationCheck.js

console.log('runValidationCheck.js has started.');

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { validateMemories } = require('../utils/verifyValidData.js');
const { ValidationError } = require('../utils/customErrors.js');

/**
 * runValidationCheck
 * Validates conversations.json against the defined schema without modifying the original file.
 */
async function runValidationCheck() {
  // Define paths
  const conversationsPath = path.join(__dirname, '..', 'data', 'conversations.json');
  const reportDir = path.join(__dirname, '..', 'output', 'reports');
  const invalidMemoriesPath = path.join(reportDir, 'invalidMemories.json');

  logger.info('Starting runValidationCheck...');
  console.log('Starting runValidationCheck...');

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

    // Step 4: Validate memories
    let validationResults;
    try {
      validationResults = validateMemories(allMemories);
      logger.info('Successfully validated memories.');
      console.log('Successfully validated memories.');
    } catch (validationError) {
      const errorMsg = `Memory validation failed: ${validationError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    const { validMemories, invalidMemories } = validationResults;

    // Step 5: Handle invalid memories
    if (invalidMemories.length > 0) {
      const warningMsg = `${invalidMemories.length} memories failed validation.`;
      logger.warn(warningMsg);
      console.warn(warningMsg);

      // Ensure the report directory exists
      try {
        await fs.mkdir(reportDir, { recursive: true });
        logger.info(`Report directory ensured at ${reportDir}`);
      } catch (dirError) {
        const errorMsg = `Failed to create report directory: ${dirError.message}`;
        logger.error(errorMsg);
        console.error(errorMsg);
        throw new ValidationError(errorMsg);
      }

      // Write invalid memories to a separate report file
      try {
        await fs.writeFile(invalidMemoriesPath, JSON.stringify(invalidMemories, null, 2), 'utf-8');
        const infoMsg = `Invalid memories written to: ${invalidMemoriesPath}`;
        logger.info(infoMsg);
        console.log(infoMsg);
      } catch (writeError) {
        const errorMsg = `Failed to write invalidMemories.json: ${writeError.message}`;
        logger.error(errorMsg);
        console.error(errorMsg);
        throw new ValidationError(errorMsg);
      }

      // Optionally, you can exit or continue based on your application's requirements
      throw new ValidationError('Some memories failed validation. Check invalidMemories.json for details.');
    }

    // Step 6: All validations passed
    const successMsg = 'All conversations are valid according to the schema.';
    logger.info(successMsg);
    console.log(successMsg);
  } catch (error) {
    logger.error(`runValidationCheck encountered an error: ${error.message}`);
    console.error(`runValidationCheck encountered an error: ${error.message}`);
    // Exit the process with a failure code if desired
    process.exit(1);
  }
}

// Execute the function if the script is run directly
if (require.main === module) {
  runValidationCheck()
    .then(() => {
      const completionMsg = 'runValidationCheck completed successfully.';
      logger.info(completionMsg);
      console.log(completionMsg);
    })
    .catch((err) => {
      const failureMsg = 'runValidationCheck failed.';
      logger.error(failureMsg);
      console.error(failureMsg);
      process.exit(1);
    });
}

module.exports = {
  runValidationCheck,
};
