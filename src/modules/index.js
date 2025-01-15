// src/modules/index.js

require('module-alias/register');
const conversationUtils = require('./conversationUtils');

const conversations = require('@conversations'); // Assume this is your data array



// Example: Get all unique action items
const actionItems = conversationUtils.getAllUniqueActionItems(conversations);
console.log('Unique Action Items:', actionItems);

/*
// Example: Get transcripts by speaker 'Alice'
const aliceTranscripts = conversationUtils.getTranscriptsBySpeaker(conversations, 'SPEAKER_01');
console.log('User\'s Transcripts:', aliceTranscripts);
*/

// Example: Count conversations created in December 2024
const dec2024Count = conversationUtils.countConversationsByCreationDate(conversations, 12, 2024);
console.log('Conversations Created in December 2024:', dec2024Count);

// app.js



// Example: Get plugin results for plugin ID 'plugin-xyz'
const pluginResults = conversationUtils.getPluginResultsById(conversations, 'dictionary');
console.log('Dictionary Results:', pluginResults);

// Example: Get source distribution
const sourceDistribution = conversationUtils.getSourceDistribution(conversations);
console.log('Source Distribution:', sourceDistribution);