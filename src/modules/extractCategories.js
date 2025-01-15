// src/modules/extractCategories.js

const logger = require('@logger');
const { categoryEmoji } = require('@globals');

/**
 * extractCategories
 * Takes an array of memory objects and returns a summary of categories
 * (plus optional associated emojis, if found in categoryEmoji).
 *
 * @param {Array} memories - The array of conversation memory objects.
 * @returns {Array} categoriesSummary - An array of objects { category, count, emoji }
 * @throws {Error} If memories is not a valid array or if memory objects lack expected structure.
 */
function extractCategories(memories = []) {
  logger.info('extractCategories: Starting category extraction.');

  // Input Validation
  if (!Array.isArray(memories)) {
    const errorMsg = 'extractCategories: Invalid input - memories should be an array.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (memories.length === 0) {
    logger.warn('extractCategories: The memories array is empty. No categories to extract.');
    return [];
  }

  // Create a map to track categories and their counts
  const categoryCounts = {};

  memories.forEach((mem, index) => {
    if (!mem || typeof mem !== 'object') {
      logger.warn(`extractCategories: Memory at index ${index} is invalid or not an object.`);
      return; // Skip invalid memory
    }

    const category = mem?.structured?.category || 'Uncategorized';

    if (typeof category !== 'string' || category.trim() === '') {
      logger.warn(`extractCategories: Memory at index ${index} has an invalid or empty category. Defaulting to 'Uncategorized'.`);
      categoryCounts['Uncategorized'] = (categoryCounts['Uncategorized'] || 0) + 1;
      return;
    }

    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Convert categoryCounts object into an array of { category, count, emoji }
  const categoriesSummary = Object.entries(categoryCounts).map(([cat, count]) => {
    return {
      category: cat,
      count,
      emoji: categoryEmoji[cat] || '❓', // Fallback emoji if category not listed
    };
  });

  logger.info(`extractCategories: Found ${categoriesSummary.length} unique categories.`);
  logger.debug(`extractCategories: Categories summary - ${JSON.stringify(categoriesSummary, null, 2)}`);

  return categoriesSummary;
}

module.exports = {
  extractCategories,
};
