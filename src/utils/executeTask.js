// src/utils/executeTask.js

const logger = require('./logger.js');

/**
 * executeTask
 * Wraps a task function to ensure it logs success or failure.
 * @param {Function} taskFn - Task function to execute
 * @param {string} description - Task description for logging
 * @returns {Promise<void>}
 * @throws {Error} Propagates any error thrown by taskFn
 */
async function executeTask(taskFn, description) {
  try {
    logger.info(`Starting: ${description}`);
    await taskFn();
    logger.info(`Completed: ${description}`);
  } catch (err) {
    logger.error(`Failed: ${description} - Error: ${err.message}`);
    throw err; // Let the CLI or higher level handle further
  }
}

module.exports = { executeTask };
