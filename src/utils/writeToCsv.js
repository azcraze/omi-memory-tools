// src/utils/writeToCsv.js

const { Parser } = require('json2csv');
const fs = require('fs').promises;
const logger = require('./logger.js');

/**
 * writeJsonToCsv
 * Converts JSON data to CSV format and writes to a file.
 * @param {Array} jsonData - Array of JSON objects.
 * @param {Array<string>} fields - Fields to include in the CSV.
 * @param {string} filePath - Path to the output CSV file.
 * @throws {Error} If jsonData is not an array or if writing fails.
 */
async function writeJsonToCsv(jsonData, fields, filePath) {
  logger.info(`writeJsonToCsv: Starting CSV writing for file ${filePath}.`);

  // Input Validation
  if (!Array.isArray(jsonData)) {
    const errorMsg = 'writeJsonToCsv: Invalid input - jsonData should be an array.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (!Array.isArray(fields) || fields.some(field => typeof field !== 'string')) {
    const errorMsg = 'writeJsonToCsv: Invalid input - fields should be an array of strings.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const parser = new Parser({ fields });
    const csv = parser.parse(jsonData);
    await fs.writeFile(filePath, csv, 'utf-8');
    logger.info(`writeJsonToCsv: CSV file written successfully at ${filePath}.`);
  } catch (error) {
    logger.error(`writeJsonToCsv: Failed to write CSV file at ${filePath}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  writeJsonToCsv,
};
