// src/modules/extractPluginResponses.js

const logger = require('../utils/logger.js');
const { pluginRenames } = require('../utils/globalVariables.js');

/**
 * extractPluginResponses
 * Iterates over each memory, collects plugin results,
 * and applies any custom renaming/formatting logic.
 *
 * @param {Array} memories - Array of conversation memory objects.
 * @returns {Array} Array of objects describing plugin responses for each memory:
 *   [{
 *       memoryId: <string>,
 *       plugins: [
 *         { pluginId, displayName, content }
 *       ]
 *    }]
 * @throws {Error} If memories is not a valid array or memory objects lack expected structure.
 */
function extractPluginResponses(memories = []) {
  logger.info('extractPluginResponses: Starting plugin responses extraction.');

  // Input Validation
  if (!Array.isArray(memories)) {
    const errorMsg = 'extractPluginResponses: Invalid input - memories should be an array.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (memories.length === 0) {
    logger.warn('extractPluginResponses: The memories array is empty. No plugin responses to extract.');
    return [];
  }

  // Create a helper map: { [pluginId]: displayName }
  const renameMap = pluginRenames.reduce((acc, item) => {
    acc[item.pluginId] = item.name;
    return acc;
  }, {});

  logger.debug(`extractPluginResponses: Plugin rename map - ${JSON.stringify(renameMap, null, 2)}`);

  const result = memories.map((mem, memIndex) => {
    if (!mem || typeof mem !== 'object') {
      logger.warn(`extractPluginResponses: Memory at index ${memIndex} is invalid or not an object. Skipping.`);
      return {
        memoryId: mem?.id || `unknown-${memIndex}`,
        plugins: [],
      };
    }

    const plugins = mem.plugins_results || [];

    if (!Array.isArray(plugins)) {
      logger.warn(`extractPluginResponses: plugins_results in memory ${mem.id || memIndex} is not an array. Skipping plugins.`);
      return {
        memoryId: mem.id || `unknown-${memIndex}`,
        plugins: [],
      };
    }

    // Transform each plugin entry
    const transformedPlugins = plugins.map((plugin, pluginIndex) => {
      if (!plugin || typeof plugin !== 'object') {
        logger.warn(`extractPluginResponses: Plugin at index ${pluginIndex} in memory ${mem.id || memIndex} is invalid or not an object. Skipping.`);
        return null; // Exclude invalid plugins
      }

      const { pluginId, content } = plugin;

      if (!pluginId) {
        logger.warn(`extractPluginResponses: Plugin at index ${pluginIndex} in memory ${mem.id || memIndex} lacks pluginId. Skipping.`);
        return null;
      }

      const displayName = renameMap[pluginId] || pluginId;

      if (typeof content !== 'string') {
        logger.warn(`extractPluginResponses: Plugin '${pluginId}' in memory ${mem.id || memIndex} has invalid content type. Expected string.`);
      }

      return {
        pluginId,
        displayName,
        content: content || '', // Default to empty string if content is missing or invalid
      };
    }).filter(plugin => plugin !== null); // Remove null entries

    return {
      memoryId: mem.id || `unknown-${memIndex}`,
      plugins: transformedPlugins,
    };
  });

  logger.info(`extractPluginResponses: Plugin responses extracted for ${result.length} memories.`);
  logger.debug(`extractPluginResponses: Plugin responses - ${JSON.stringify(result, null, 2)}`);

  return result;
}

module.exports = {
  extractPluginResponses,
};
