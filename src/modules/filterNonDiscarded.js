// src/modules/filterNonDiscarded.js

const logger = require('../utils/logger.js');

/**
 * filterNonDiscarded
 * Filters out conversations that are discarded or deleted.
 *
 * @param {Array} memories - An array of conversation memory objects.
 * @returns {Array} A new array containing only non-discarded, non-deleted items.
 * @throws {Error} If input is not an array.
 */
function filterNonDiscarded(memories = []) {
  if (!Array.isArray(memories)) {
    const errorMsg = 'Invalid input: memories should be an array.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.info('Filtering out discarded/deleted conversations...');
  const filtered = memories.filter(mem => !mem.discarded && !mem.deleted);
  logger.info(`Total: ${memories.length}; Non-discarded/deleted: ${filtered.length}`);
  return filtered;
}

module.exports = {
  filterNonDiscarded,
};
