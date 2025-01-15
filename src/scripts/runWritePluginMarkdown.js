// src/scripts/runWritePluginMarkdown.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { pluginRenamesMap } = require('../utils/globalVariables.js');
const { ValidationError, FileOperationError, MemoryProcessingError } = require('../utils/customErrors.js');

/**
 * runWritePluginMarkdown
 * Processes plugin responses and generates individual Markdown files for each plugin.
 * Each Markdown file contains all responses from that plugin across all non-discarded memories,
 * including the conversation title, overview, and formatted date/time.
 */
async function runWritePluginMarkdown() {
    const filteredConversationsPath = path.join(__dirname, '..', 'data', 'filteredConversations.json');
    const outputDirPlugins = path.join(__dirname, '..', 'output', 'plugins');

    logger.info('runWritePluginMarkdown: Starting plugin Markdown generation process.');
    console.log('runWritePluginMarkdown: Starting plugin Markdown generation process.');

    try {
        // Step 1: Ensure output directory exists
        try {
            await fs.mkdir(outputDirPlugins, { recursive: true });
            logger.info(`runWritePluginMarkdown: Ensured output directory at ${outputDirPlugins}.`);
        } catch (mkdirError) {
            const errorMsg = `runWritePluginMarkdown: Failed to create output directory at ${outputDirPlugins}: ${mkdirError.message}`;
            logger.error(errorMsg);
            console.error(errorMsg);
            throw new FileOperationError(errorMsg);
        }

        // Step 2: Read filteredConversations.json
        let filteredConversations;
        try {
            const rawConversations = await fs.readFile(filteredConversationsPath, 'utf-8');
            filteredConversations = JSON.parse(rawConversations);
            logger.info(`runWritePluginMarkdown: Successfully read and parsed filteredConversations.json from ${filteredConversationsPath}.`);
        } catch (readError) {
            const errorMsg = `runWritePluginMarkdown: Failed to read or parse filteredConversations.json: ${readError.message}`;
            logger.error(errorMsg);
            console.error(errorMsg);
            throw new ValidationError(errorMsg);
        }

        // Step 3: Validate that filteredConversations is an array
        if (!Array.isArray(filteredConversations)) {
            const errorMsg = 'runWritePluginMarkdown: Invalid data format - filteredConversations.json should contain an array.';
            logger.error(errorMsg);
            console.error(errorMsg);
            throw new ValidationError(errorMsg);
        }

        logger.info(`runWritePluginMarkdown: Processing ${filteredConversations.length} memories.`);

        // Step 4: Group plugin responses by pluginId
        const pluginsGrouped = {};

        filteredConversations.forEach(mem => {
            const { id: memoryId, structured, created_at, plugins_results } = mem;

            if (!plugins_results || !Array.isArray(plugins_results)) {
                logger.warn(`runWritePluginMarkdown: Memory ID ${memoryId} does not have a valid plugins_results array. Skipping.`);
                return;
            }

            plugins_results.forEach(plugin => {
                const { pluginId, content } = plugin;

                if (!pluginId) {
                    logger.warn(`runWritePluginMarkdown: Memory ID ${memoryId} has a plugin response without a pluginId. Skipping.`);
                    return;
                }

                if (!content) {
                    logger.warn(`runWritePluginMarkdown: Memory ID ${memoryId} has a plugin response without content. Skipping.`);
                    return;
                }

                if (!pluginsGrouped[pluginId]) {
                    pluginsGrouped[pluginId] = [];
                }

                pluginsGrouped[pluginId].push({
                    memoryId,
                    title: structured?.title || 'Untitled Conversation',
                    overview: structured?.overview || 'No overview available.',
                    timestamp: created_at || 'Unknown date',
                    content,
                });
            });
        });

        const pluginIds = Object.keys(pluginsGrouped);
        logger.info(`runWritePluginMarkdown: Found ${pluginIds.length} unique plugins.`);
        console.log(`runWritePluginMarkdown: Found ${pluginIds.length} unique plugins.`);

        if (pluginIds.length === 0) {
            logger.warn('runWritePluginMarkdown: No plugin responses found to process.');
            console.warn('runWritePluginMarkdown: No plugin responses found to process.');
            return;
        }

        // Step 5: Iterate over each pluginId and generate Markdown files
        for (const pluginId of pluginIds) {
            const displayName = pluginRenamesMap[pluginId] || pluginId; // Fallback to pluginId if no displayName

            // Sanitize displayName for file naming
            const sanitizedDisplayName = sanitizeFileName(displayName);

            const pluginMarkdownPath = path.join(outputDirPlugins, `${sanitizedDisplayName}.md`);

            let markdownContent = `# ${displayName}\n\n`;
            markdownContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;

            const responses = pluginsGrouped[pluginId];

            responses.forEach((resp, index) => {
                const { title, overview, timestamp, content } = resp;
                const formattedDate = formatDate(timestamp);

                markdownContent += `## Response ${index + 1}\n\n`;
                markdownContent += `**Title:** ${sanitizeMarkdown(title)}\n\n`;
                markdownContent += `**Overview:** ${sanitizeMarkdown(overview)}\n\n`;
                markdownContent += `**Date/Time:** ${formattedDate}\n\n`;
                markdownContent += `**Response:**\n\n${sanitizeMarkdown(content)}\n\n`;
                markdownContent += `---\n\n`;
            });

            try {
                await fs.writeFile(pluginMarkdownPath, markdownContent, 'utf-8');
                logger.info(`runWritePluginMarkdown: Successfully wrote Markdown file for plugin '${displayName}' at ${pluginMarkdownPath}.`);
                console.log(`runWritePluginMarkdown: Successfully wrote Markdown file for plugin '${displayName}'.`);
            } catch (writeError) {
                const errorMsg = `runWritePluginMarkdown: Failed to write Markdown file for plugin '${displayName}' at ${pluginMarkdownPath}: ${writeError.message}`;
                logger.error(errorMsg);
                console.error(errorMsg);
                throw new FileOperationError(errorMsg);
            }
        }

        logger.info('runWritePluginMarkdown: Plugin Markdown generation process completed successfully.');
        console.log('runWritePluginMarkdown: Plugin Markdown generation process completed successfully.');
    } catch (error) {
        logger.error(`runWritePluginMarkdown: Process failed - ${error.message}`);
        console.error(`runWritePluginMarkdown: Process failed - ${error.message}`);
        process.exit(1);
    }
}

/**
 * sanitizeFileName
 * Removes or replaces characters that are invalid for file names.
 * @param {string} name - The original file name.
 * @returns {string} - Sanitized file name.
 */
function sanitizeFileName(name) {
    return name.replace(/[/\\?%*:|"<>]/g, '-').trim();
}

/**
 * sanitizeMarkdown
 * Sanitizes input strings to prevent Markdown injection and ensure table integrity.
 * @param {string} text - The input string to sanitize.
 * @returns {string} - Sanitized string safe for Markdown.
 */
function sanitizeMarkdown(text = '') {
    if (typeof text !== 'string') {
        return '';
    }
    return text.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
}

/**
 * formatDate
 * Converts a date string or timestamp into a human-readable format.
 * @param {string|number} timestamp - The original date/time value.
 * @returns {string} - Formatted date/time string.
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    if (isNaN(date)) {
        return 'Invalid Date';
    }
    return date.toLocaleString();
}

module.exports = {
    runWritePluginMarkdown,
};

// Execute the function if the script is run directly
if (require.main === module) {
    (async () => {
        try {
            logger.info('runWritePluginMarkdown.js: Starting the plugin Markdown generation script.');
            await runWritePluginMarkdown();
        } catch (error) {
            logger.error(`runWritePluginMarkdown.js: Script terminated unexpectedly - ${error.message}`);
            console.error('runWritePluginMarkdown.js: Script terminated unexpectedly. Check logs for details.');
            process.exit(1);
        }
    })();
}