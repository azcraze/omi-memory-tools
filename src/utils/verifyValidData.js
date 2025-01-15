// src/utils/verifyValidData.js

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const logger = require('./logger.js');
const memoriesSchema = require('../data/memoriesSchema.json');

/**
 * validateMemories - validates an array of conversation memories against our JSON schema.
 * @param {Array} memories - The array of memory objects to validate.
 * @returns {Object} validationResults
 *   - validMemories: An array of valid memory objects
 *   - invalidMemories: An array of objects { index, errors, data }
 * @throws {Error} If memories is not an array or AJV compilation fails.
 */
function validateMemories(memories = []) {
  if (!Array.isArray(memories)) {
    const errorMsg = 'Invalid input: memories should be an array.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Initialize AJV
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  let validate;
  try {
    validate = ajv.compile(memoriesSchema);
    logger.info('Successfully compiled JSON schema for validation.');
  } catch (compileError) {
    const errorMsg = `Failed to compile JSON schema: ${compileError.message}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  const validMemories = [];
  const invalidMemories = [];

  // Validate each memory entry
  memories.forEach((memory, index) => {
    let isValid;
    try {
      isValid = validate(memory);
    } catch (validationError) {
      logger.error(`Validation threw an error for memory at index ${index}: ${validationError.message}`);
      invalidMemories.push({
        index,
        errors: [{ message: validationError.message }],
        data: memory,
      });
      return;
    }

    if (!isValid) {
      invalidMemories.push({
        index,
        errors: validate.errors,
        data: memory,
      });
      logger.warn(`Memory at index ${index} failed validation.`);

      // Log each validation error in detail
      validate.errors.forEach((err) => {
        logger.warn(`Validation error in memory ${index}: [${err.instancePath}] ${err.message}`);
      });
    } else {
      validMemories.push(memory);
    }
  });

  logger.info(`Validation complete: ${validMemories.length} valid, ${invalidMemories.length} invalid.`);
  return { validMemories, invalidMemories };
}

module.exports = { validateMemories };
