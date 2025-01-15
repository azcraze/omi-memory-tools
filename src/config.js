// src/config.js

require('module-alias/register');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file, if available
dotenv.config();

const config = {
  // **Logging Configuration**
  logging: {
    level: process.env.LOG_LEVEL || 'debug', // Allows overriding via .env
    file: path.resolve(__dirname, '../logs/app.log'),
  },

  // **Directory Paths**
  dirs: {
    output: path.resolve(__dirname, '../output'),
    filteredData: path.resolve(__dirname, '../output/filteredData'),
    json: path.resolve(__dirname, '../output/json'),
    csv: path.resolve(__dirname, '../output/csv'),
    markdown: path.resolve(__dirname, '../output/markdown'),
    pluginResponses: path.resolve(__dirname, '../output/plugin_responses'),
    data: path.resolve(__dirname, '../src/data'),
    schemas: path.resolve(__dirname, '../src/data/schemas'),
  },

  // **File Paths**
  files: {
    rawData: path.resolve(__dirname, '../src/data/conversations.json'),
    cleanData: path.resolve(__dirname, '../output/filteredData/filteredNonDiscarded.json'),
    filtered: {
      plugins: path.resolve(__dirname, '../output/filteredData/pluginResponses.json'),
      transcripts: path.resolve(__dirname, '../output/filteredData/transcripts.json'),
      emojis: path.resolve(__dirname, '../output/filteredData/emojis.json'),
      categories: path.resolve(__dirname, '../output/filteredData/categories.json'),
      events: path.resolve(__dirname, '../output/filteredData/events.json'),
      tasks: path.resolve(__dirname, '../output/filteredData/tasks.json'),
      shoppingList: path.resolve(__dirname, '../output/filteredData/shoppingList.json'),
      notDeleted: path.resolve(__dirname, '../output/filteredData/notDeleted.json'),
    },
    schema: path.resolve(__dirname, '../src/data/schemas/memorySchema.json'),
  },

  // **Text Analysis Configuration**
  textAnalysis: {
    topWords: parseInt(process.env.TOP_WORDS, 10) || 10, // Allows overriding via .env
    topPhrases: parseInt(process.env.TOP_PHRASES, 10) || 10, // Allows overriding via .env
    phraseLength: parseInt(process.env.PHRASE_LENGTH, 10) || 2, // Allows overriding via .env
  },
};

module.exports = config;