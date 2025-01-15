// conversationUtils.js
require('module-alias/register');

const config = require('@config');
const _ = require('lodash');

/**
 * Utility module for handling Conversation Objects.
 * Each function utilizes lodash for efficient data manipulation.
 */

/**
 * Finds a conversation by its unique ID.
 * @param {Array} conversations - Array of conversation objects.
 * @param {string} id - UUID of the conversation.
 * @returns {Object|null} - The found conversation or null if not found.
 */
const findConversationById = (conversations, id) => {
    return _.find(conversations, {
        id
    }) || null;
};

/**
 * Filters conversations based on their status.
 * @param {Array} conversations - Array of conversation objects.
 * @param {string} status - Status to filter by.
 * @returns {Array} - Array of conversations matching the status.
 */
const filterConversationsByStatus = (conversations, status) => {
    return _.filter(conversations, {
        status
    });
};

/**
 * Groups conversations by their category.
 * @param {Array} conversations - Array of conversation objects.
 * @returns {Object} - An object with categories as keys and arrays of conversations as values.
 */
const groupConversationsByCategory = (conversations) => {
    return _.groupBy(conversations, (conv) => _.get(conv, 'structured.category', 'Uncategorized'));
};

/**
 * Extracts all unique action items from the conversations.
 * @param {Array} conversations - Array of conversation objects.
 * @returns {Array} - Array of unique action items.
 */
const getAllUniqueActionItems = (conversations) => {
    return _.uniq(_.flatMap(conversations, (conv) => _.get(conv, 'structured.actionItems', [])));
};

/**
 * Retrieves all event titles within a specified date range.
 * @param {Array} conversations - Array of conversation objects.
 * @param {string} startDate - ISO date-time string representing the start of the range.
 * @param {string} endDate - ISO date-time string representing the end of the range.
 * @returns {Array} - Array of event titles occurring within the date range.
 */
const getEventTitlesInDateRange = (conversations, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return _.chain(conversations)
        .flatMap((conv) => _.get(conv, 'structured.events', []))
        .filter((event) => {
            const eventDate = new Date(event.startsAt);
            return eventDate >= start && eventDate <= end;
        })
        .map('title')
        .value();
};

/**
 * Summarizes the total duration of all events in each conversation.
 * @param {Array} conversations - Array of conversation objects.
 * @returns {Array} - Array of objects containing conversation ID and total event duration.
 */
const summarizeEventDurations = (conversations) => {
    return _.map(conversations, (conv) => {
        const totalDuration = _.sumBy(_.get(conv, 'structured.events', []), 'duration');
        return {
            id: conv.id,
            totalEventDuration: totalDuration,
        };
    });
};

/**
 * Retrieves all transcripts spoken by a specific speaker.
 * @param {Array} conversations - Array of conversation objects.
 * @param {string} speakerName - Name of the speaker.
 * @returns {Array} - Array of transcript segments spoken by the specified speaker.
 */
const getTranscriptsBySpeaker = (conversations, speakerName) => {
    return _.flatMap(conversations, (conv) =>
        _.filter(_.get(conv, 'transcript_segments', []), {
            speaker: speakerName
        })
    );
};

/**
 * Counts the number of conversations created within a specific month and year.
 * @param {Array} conversations - Array of conversation objects.
 * @param {number} month - Month (1-12).
 * @param {number} year - Year (e.g., 2025).
 * @returns {number} - Count of conversations created in the specified month and year.
 */
const countConversationsByCreationDate = (conversations, month, year) => {
    return _.filter(conversations, (conv) => {
        const createdAt = new Date(conv.created_at);
        return createdAt.getMonth() + 1 === month && createdAt.getFullYear() === year;
    }).length;
};

/**
 * Extracts plugin results for a specific plugin ID across all conversations.
 * @param {Array} conversations - Array of conversation objects.
 * @param {string} pluginId - ID of the plugin.
 * @returns {Array} - Array of plugin contents matching the plugin ID.
 */
const getPluginResultsById = (conversations, pluginId) => {
    return _.flatMap(conversations, (conv) =>
        _.map(
            _.filter(_.get(conv, 'plugins_results', []), {
                pluginId
            }),
            'content'
        )
    );
};

/**
 * Checks if a conversation has been discarded or deleted.
 * @param {Object} conversation - A single conversation object.
 * @returns {boolean} - True if discarded or deleted, else false.
 */
const isConversationDiscardedOrDeleted = (conversation) => {
    return conversation.discarded || conversation.deleted;
};

/**
 * Retrieves conversations with geolocation data.
 * @param {Array} conversations - Array of conversation objects.
 * @returns {Array} - Array of conversations that have geolocation information.
 */
const getConversationsWithGeolocation = (conversations) => {
    return _.filter(conversations, (conv) => conv.geolocation !== null);
};

/**
 * Extracts all unique languages used in the conversations.
 * @param {Array} conversations - Array of conversation objects.
 * @returns {Array} - Array of unique languages.
 */
const getAllUniqueLanguages = (conversations) => {
    return _.uniq(
        _.compact(_.map(conversations, (conv) => conv.language))
    );
};

/**
 * Retrieves the source distribution of conversations.
 * @param {Array} conversations - Array of conversation objects.
 * @returns {Object} - An object with sources as keys and their counts as values.
 */
const getSourceDistribution = (conversations) => {
    return _.countBy(conversations, 'source');
};

/**
 * Extracts external data for a specific key across all conversations.
 * @param {Array} conversations - Array of conversation objects.
 * @param {string} key - Key to extract from external_data.
 * @returns {Array} - Array of values corresponding to the specified key.
 */
const getExternalDataByKey = (conversations, key) => {
    return _.compact(
        _.map(conversations, (conv) => _.get(conv, ['external_data', key], null))
    );
};

// Exporting all utility functions
module.exports = {
    findConversationById,
    filterConversationsByStatus,
    groupConversationsByCategory,
    getAllUniqueActionItems,
    getEventTitlesInDateRange,
    summarizeEventDurations,
    getTranscriptsBySpeaker,
    countConversationsByCreationDate,
    getPluginResultsById,
    isConversationDiscardedOrDeleted,
    getConversationsWithGeolocation,
    getAllUniqueLanguages,
    getSourceDistribution,
    getExternalDataByKey,
};



