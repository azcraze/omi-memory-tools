// scripts/setupProject.js

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

/**
 * Helper function to create a directory if it doesn't exist.
 * @param {string} dirPath - The path of the directory to create.
 */
async function createDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(chalk.green(`Created directory: ${dirPath}`));
  } catch (err) {
    console.error(chalk.red(`Failed to create directory ${dirPath}: ${err.message}`));
  }
}

/**
 * Helper function to create a file with content if it doesn't exist.
 * @param {string} filePath - The path of the file to create.
 * @param {string} content - The content to write into the file.
 */
async function createFile(filePath, content) {
  try {
    // Check if file exists
    await fs.access(filePath);
    console.log(chalk.yellow(`File already exists: ${filePath}`));
  } catch {
    // File does not exist, create it
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(chalk.green(`Created file: ${filePath}`));
    } catch (err) {
      console.error(chalk.red(`Failed to create file ${filePath}: ${err.message}`));
    }
  }
}

/**
 * Main function to scaffold the project.
 */
async function scaffoldProject() {
  const projectRoot = process.cwd();

  // Define directory structure
  const directories = [
    'src',
    'src/modules',
    'src/scripts',
    'src/utils',
    'src/webhook',
    'src/data',
    'output',
    'output/markdown',
    'output/csv',
    'output/reports',
    'logs',
    'tests',
  ];

  // Create directories
  for (const dir of directories) {
    const dirPath = path.join(projectRoot, dir);
    await createDirectory(dirPath);
  }

  // Define files with their content
  const files = [
    {
      path: 'src/utils/logger.js',
      content: `// src/utils/logger.js

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { LOG_DIR } = require('../config.js');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// File paths for the log files
const infoLogPath = path.join(LOG_DIR, 'info.log');
const errorLogPath = path.join(LOG_DIR, 'error.log');
const debugLogPath = path.join(LOG_DIR, 'debug.log'); // Optional

/**
 * Writes a log message to a specified file.
 * Adds a timestamp to each entry.
 */
function writeToFile(filePath, message) {
  const timestamp = new Date().toISOString();
  const entry = \`[\${timestamp}] \${message}\n\`;
  fs.appendFile(filePath, entry, 'utf-8', (err) => {
    if (err) {
      console.error(chalk.red('Failed to write to log file:'), err);
    }
  });
}

/**
 * logger.info
 * - Writes informational messages to the console in green color.
 * - Appends the message to info.log with a timestamp.
 */
function info(...args) {
  const message = args.join(' ');
  console.log(chalk.green('[INFO]'), message);
  writeToFile(infoLogPath, \`[INFO] \${message}\`);
}

/**
 * logger.error
 * - Writes error messages to the console in red color.
 * - Appends the message to error.log with a timestamp.
 */
function error(...args) {
  const message = args.join(' ');
  console.error(chalk.red('[ERROR]'), message);
  writeToFile(errorLogPath, \`[ERROR] \${message}\`);
}

/**
 * logger.warn
 * - Writes warning messages to the console in yellow color.
 * - Appends the message to info.log (or a separate warnings file if desired).
 */
function warn(...args) {
  const message = args.join(' ');
  console.warn(chalk.yellow('[WARN]'), message);
  writeToFile(infoLogPath, \`[WARN] \${message}\`);
}

/**
 * logger.debug
 * - Writes debug messages to the console in blue color.
 * - Appends the message to debug.log with a timestamp.
 * - Only active if DEBUG environment variable is set.
 */
function debug(...args) {
  if (process.env.DEBUG) {
    const message = args.join(' ');
    console.log(chalk.blue('[DEBUG]'), message);
    writeToFile(debugLogPath, \`[DEBUG] \${message}\`);
  }
}

module.exports = {
  info,
  error,
  warn,
  debug,
};
`,
    },
    {
      path: 'src/utils/customErrors.js',
      content: `// src/utils/customErrors.js

class MemoryProcessingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MemoryProcessingError';
  }
}

class FileOperationError extends MemoryProcessingError {
  constructor(message) {
    super(message);
    this.name = 'FileOperationError';
  }
}

class ValidationError extends MemoryProcessingError {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class WebhookError extends MemoryProcessingError {
  constructor(message) {
    super(message);
    this.name = 'WebhookError';
  }
}

// Add more custom error classes as needed

module.exports = {
  MemoryProcessingError,
  FileOperationError,
  ValidationError,
  WebhookError,
};
`,
    },
    {
      path: 'src/utils/formatMarkdown.js',
      content: `// src/utils/formatMarkdown.js

/**
 * formatCategoriesMarkdown
 * Formats category summaries into Markdown tables.
 * @param {Array} categories - Array of { category, count, emoji }
 * @returns {string} - Markdown formatted string
 */
function formatCategoriesMarkdown(categories = []) {
  let markdown = '## Categories Summary\\n\\n';
  markdown += '| Category | Count | Emoji |\\n';
  markdown += '|----------|-------|-------|\\n';
  categories.forEach(cat => {
    markdown += \`| \${cat.category} | \${cat.count} | \${cat.emoji} |\\n\`;
  });
  markdown += '\\n';
  return markdown;
}

/**
 * formatTranscriptMarkdown
 * Formats transcript segments into Markdown.
 * @param {Array} transcripts - Array of { memoryId, transcript: [ { text, speaker, ... } ] }
 * @returns {string} - Markdown formatted string
 */
function formatTranscriptMarkdown(transcripts = []) {
  let markdown = '## Transcripts\\n\\n';
  transcripts.forEach(mem => {
    markdown += \`### Memory ID: \${mem.memoryId}\\n\\n\`;
    markdown += '| Speaker | Text | Start (s) | End (s) |\\n';
    markdown += '|---------|------|-----------|---------|\\n';
    mem.transcript.forEach(seg => {
      markdown += \`| \${seg.speaker} | \${seg.text} | \${seg.start} | \${seg.end} |\\n\`;
    });
    markdown += '\\n';
  });
  return markdown;
}

// Add more formatting functions as needed

module.exports = {
  formatCategoriesMarkdown,
  formatTranscriptMarkdown,
};
`,
    },
    {
      path: 'src/utils/writeToCsv.js',
      content: `// src/utils/writeToCsv.js

const { Parser } = require('json2csv');
const fs = require('fs').promises;
const logger = require('./logger.js');

/**
 * writeJsonToCsv
 * Converts JSON data to CSV format and writes to a file.
 * @param {Array} jsonData - Array of JSON objects.
 * @param {Array<string>} fields - Fields to include in the CSV.
 * @param {string} filePath - Path to the output CSV file.
 */
async function writeJsonToCsv(jsonData, fields, filePath) {
  try {
    const parser = new Parser({ fields });
    const csv = parser.parse(jsonData);
    await fs.writeFile(filePath, csv, 'utf-8');
    logger.info(\`CSV file written successfully: \${filePath}\`);
  } catch (error) {
    logger.error(\`Failed to write CSV file at \${filePath}: \${error.message}\`);
    throw error;
  }
}

module.exports = {
  writeJsonToCsv,
};
`,
    },
    {
      path: 'src/config.js',
      content: `// src/config.js

const path = require('path');

const ROOT_DIR = process.cwd();
const LOG_DIR = path.join(ROOT_DIR, 'logs');
const OUTPUT_DIR = path.join(ROOT_DIR, 'output');

module.exports = {
  ROOT_DIR,
  LOG_DIR,
  OUTPUT_DIR,
  // Add more config variables here as needed
};
`,
    },
    {
      path: 'src/data/memoriesSchema.json',
      content: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Memories Schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid",
        "description": "Unique identifier for the conversation memory."
      },
      "created_at": {
        "type": "string",
        "format": "date-time",
        "description": "Timestamp when the memory was created."
      },
      "structured": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Title of the conversation."
          },
          "overview": {
            "type": "string",
            "description": "Overview or summary of the conversation."
          },
          "emoji": {
            "type": "string",
            "description": "Emoji representing the conversation topic."
          },
          "category": {
            "type": "string",
            "description": "Category of the conversation (e.g., technology)."
          },
          "actionItems": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "List of action items derived from the conversation."
          },
          "events": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string",
                  "description": "Title of the event."
                },
                "starts_at": {
                  "type": "string",
                  "format": "date-time",
                  "description": "Start time of the event."
                },
                "duration": {
                  "type": "integer",
                  "description": "Duration of the event in minutes."
                },
                "description": {
                  "type": "string",
                  "description": "Detailed description of the event."
                },
                "created": {
                  "type": "boolean",
                  "description": "Flag indicating if the event was created."
                }
              },
              "required": ["title", "starts_at", "duration", "description", "created"],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "title",
          "overview",
          "emoji",
          "category",
          "actionItems",
          "events"
        ],
        "additionalProperties": false
      },
      "started_at": {
        "type": "string",
        "format": "date-time",
        "description": "Timestamp when the conversation started."
      },
      "finished_at": {
        "type": "string",
        "format": "date-time",
        "description": "Timestamp when the conversation ended."
      },
      "transcript_segments": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "text": {
              "type": "string",
              "description": "Text of the transcript segment."
            },
            "speaker": {
              "type": "string",
              "description": "Identifier for the speaker (e.g., SPEAKER_1)."
            },
            "speaker_id": {
              "type": "integer",
              "description": "Numeric ID of the speaker."
            },
            "is_user": {
              "type": "boolean",
              "description": "Flag indicating if the speaker is a user."
            },
            "start": {
              "type": "number",
              "description": "Start time of the segment in seconds."
            },
            "end": {
              "type": "number",
              "description": "End time of the segment in seconds."
            }
          },
          "required": ["text", "speaker", "speaker_id", "is_user", "start", "end"],
          "additionalProperties": false
        },
        "description": "Array of transcript segments from the conversation."
      },
      "plugins_results": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "pluginId": {
              "type": "string",
              "description": "Identifier of the plugin used."
            },
            "content": {
              "type": "string",
              "description": "Content or result produced by the plugin."
            }
          },
          "required": ["pluginId", "content"],
          "additionalProperties": true
        },
        "description": "Results from various plugins associated with the conversation."
      },
      "geolocation": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "latitude": {
                "type": "number",
                "description": "Latitude coordinate."
              },
              "longitude": {
                "type": "number",
                "description": "Longitude coordinate."
              },
              "altitude": {
                "type": "number",
                "description": "Altitude information."
              },
              "accuracy": {
                "type": "number",
                "description": "Accuracy of the geolocation data."
              }
            },
            "required": ["latitude", "longitude"],
            "additionalProperties": false
          },
          {
            "type": "null",
            "description": "No geolocation data available."
          }
        ],
        "description": "Geolocation data associated with the conversation, if any."
      },
      "photos": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "url": {
              "type": "string",
              "format": "uri",
              "description": "URL of the photo."
            },
            "description": {
              "type": "string",
              "description": "Description or metadata of the photo."
            },
            "timestamp": {
              "type": "string",
              "format": "date-time",
              "description": "Timestamp when the photo was taken."
            }
          },
          "required": ["url"],
          "additionalProperties": false
        },
        "description": "Array of photos associated with the conversation."
      },
      "discarded": {
        "type": "boolean",
        "description": "Flag indicating if the memory has been discarded."
      },
      "deleted": {
        "type": "boolean",
        "description": "Flag indicating if the memory has been deleted."
      },
      "source": {
        "type": "string",
        "enum": ["ConversationSource.friend"],
        "description": "Source of the conversation."
      },
      "language": {
        "oneOf": [
          {
            "type": "string",
            "description": "Language code of the conversation (e.g., en for English)."
          },
          {
            "type": "null",
            "description": "No language data available."
          }
        ]
      },
      "external_data": {
        "oneOf": [
          {
            "type": "object",
            "description": "External data associated with the conversation."
          },
          {
            "type": "null",
            "description": "No external data available."
          }
        ]
      },
      "status": {
        "type": "string",
        "description": "Current status of the conversation memory."
      }
    },
    "required": [
      "id",
      "created_at",
      "structured",
      "started_at",
      "finished_at",
      "transcript_segments",
      "plugins_results",
      "discarded",
      "deleted",
      "source",
      "language",
      "status"
    ],
    "additionalProperties": true
  },
  "description": "Array of conversation memory objects."
}
`,
    },
    {
      path: 'src/utils/verifyValidData.js',
      content: `// src/utils/verifyValidData.js

const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const logger = require('./logger.js');
const memoriesSchema = require('../data/memoriesSchema.json');

/**
 * validateMemories - validates an array of conversation memories against our JSON schema.
 * @param {Array} memories - The array of memory objects to validate.
 * @returns {Object} validationResults
 *  - validMemories: An array of valid memory objects
 *  - invalidMemories: An array of objects { index, errors, data }
 */
function validateMemories(memories = []) {
  // Compile the schema once
  const validate = ajv.compile(memoriesSchema);

  const validMemories = [];
  const invalidMemories = [];

  // Validate each memory entry
  memories.forEach((memory, index) => {
    const isValid = validate(memory);

    if (!isValid) {
      invalidMemories.push({
        index,
        errors: validate.errors,
        data: memory,
      });
      logger.warn(\`Memory at index \${index} failed validation.\`);
    } else {
      validMemories.push(memory);
    }
  });

  logger.info(\`Validation complete: \${validMemories.length} valid, \${invalidMemories.length} invalid.\`);
  return { validMemories, invalidMemories };
}

module.exports = {
  validateMemories,
};
`,
    },
    {
      path: 'src/modules/filterNonDiscarded.js',
      content: `// src/modules/filterNonDiscarded.js

const logger = require('../utils/logger.js');

/**
 * filterNonDiscarded
 * Filters out conversations that are discarded or deleted.
 *
 * @param {Array} memories - An array of conversation memory objects.
 * @returns {Array} A new array containing only non-discarded, non-deleted items.
 */
function filterNonDiscarded(memories = []) {
  logger.info('Filtering out discarded/deleted conversations...');
  const filtered = memories.filter(mem => !mem.discarded && !mem.deleted);
  logger.info(\`Total: \${memories.length}; Non-discarded/deleted: \${filtered.length}\`);
  return filtered;
}

module.exports = {
  filterNonDiscarded,
};
`,
    },
    {
      path: 'src/modules/extractCategories.js',
      content: `// src/modules/extractCategories.js

const logger = require('../utils/logger.js');
const { categoryEmoji } = require('../utils/globalVariables.js');

/**
 * extractCategories
 * Takes an array of memory objects and returns a summary of categories
 * (plus optional associated emojis, if found in categoryEmoji).
 *
 * @param {Array} memories - The array of conversation memory objects.
 * @returns {Array} categoriesSummary - An array of objects { category, count, emoji }
 */
function extractCategories(memories = []) {
  logger.info('Extracting categories from memories...');

  // Create a map to track categories and their counts
  const categoryCounts = {};

  memories.forEach(mem => {
    const category = mem?.structured?.category || 'Uncategorized';
    if (!categoryCounts[category]) {
      categoryCounts[category] = 0;
    }
    categoryCounts[category]++;
  });

  // Convert categoryCounts object into an array of { category, count, emoji }
  const categoriesSummary = Object.entries(categoryCounts).map(([cat, count]) => {
    return {
      category: cat,
      count,
      emoji: categoryEmoji[cat] || '❓', // fallback emoji if category not listed
    };
  });

  logger.info(\`Found \${categoriesSummary.length} unique categories.\`);
  return categoriesSummary;
}

module.exports = {
  extractCategories,
};
`,
    },
    {
      path: 'src/modules/extractTranscriptSegments.js',
      content: `// src/modules/extractTranscriptSegments.js

const logger = require('../utils/logger.js');

/**
 * extractTranscriptSegments
 * Iterates through each memory and returns an array of relevant transcript info.
 *
 * @param {Array} memories - Array of memory objects.
 * @returns {Array} Array of objects { memoryId, transcript: [ { text, speaker, ... } ] }
 */
function extractTranscriptSegments(memories = []) {
  logger.info('Extracting transcript segments...');

  const result = memories.map(mem => {
    const segments = mem.transcript_segments || [];
    return {
      memoryId: mem.id,
      transcript: segments.map(seg => ({
        text: seg.text,
        speaker: seg.speaker,
        speaker_id: seg.speaker_id,
        is_user: seg.is_user,
        start: seg.start,
        end: seg.end,
      })),
    };
  });

  logger.info(\`Transcript segments extracted for \${result.length} memories.\`);
  return result;
}

module.exports = {
  extractTranscriptSegments,
};
`,
    },
    {
      path: 'src/modules/extractPluginResponses.js',
      content: `// src/modules/extractPluginResponses.js

const logger = require('../utils/logger.js');
const { pluginRenames } = require('../utils/globalVariables.js');

/**
 * extractPluginResponses
 * Iterates over each memory, collects plugin results,
 * and applies any custom renaming/formatting logic.
 *
 * @param {Array} memories - Array of memory objects
 * @returns {Array} Array of objects describing plugin responses for each memory:
 *   [{
 *       memoryId: <string>,
 *       plugins: [
 *         { pluginId, displayName, content }
 *       ]
 *    }]
 */
function extractPluginResponses(memories = []) {
  logger.info('Extracting plugin responses...');

  // Create a helper map: { [pluginId]: displayName }
  const renameMap = pluginRenames.reduce((acc, item) => {
    acc[item.pluginId] = item.name; 
    return acc;
  }, {});

  const result = memories.map(mem => {
    const plugins = mem.plugins_results || [];

    // Transform each plugin entry
    const transformedPlugins = plugins.map(plugin => {
      const displayName = renameMap[plugin.pluginId] || plugin.pluginId;
      return {
        pluginId: plugin.pluginId,
        displayName,
        content: plugin.content,
      };
    });

    return {
      memoryId: mem.id,
      plugins: transformedPlugins,
    };
  });

  logger.info(\`Plugin responses extracted for \${result.length} memories.\`);
  return result;
}

module.exports = {
  extractPluginResponses,
};
`,
    },
    {
      path: 'src/modules/textAnalysis.js',
      content: `// src/modules/textAnalysis.js

const logger = require('../utils/logger.js');
const _ = require('lodash');

// A simple default stopwords list (English example).
// You can expand this or move it to globalVariables.js if you prefer.
const defaultStopwords = [
  'the', 'and', 'of', 'to', 'a', 'i', 'it', 'in', 'is', 'you', 'that', 
  'for', 'on', 'was', 'with', 'as', 'this', 'but', 'be', 'are', 'have',
  'not', 'at', 'or', 'he', 'by', 'from'
];

/**
 * cleanAndTokenize
 * - Lowercases text, removes punctuation (basic approach), splits into tokens.
 * @param {string} text
 * @returns {Array<string>} tokens
 */
function cleanAndTokenize(text) {
  // Convert to lowercase
  let cleaned = text.toLowerCase();

  // Remove punctuation (basic regex approach)
  // This will remove everything that isn't a letter, number, or space.
  cleaned = cleaned.replace(/[^a-z0-9\s]+/gi, '');

  // Split on whitespace
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return tokens;
}

/**
 * getNgrams
 * - Converts an array of tokens into an array of n-grams.
 *   e.g., tokens = ["i", "love", "red", "apples"], n=2 => ["i love", "love red", "red apples"]
 * @param {Array<string>} tokens
 * @param {number} n - e.g., 2 for bigrams, 3 for trigrams
 * @returns {Array<string>}
 */
function getNgrams(tokens, n) {
  const ngrams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * getWordFrequency
 * - Calculates the frequency of each token or n-gram in the transcripts.
 * @param {Array<object>} transcripts - Array of { text, speaker, ... }
 * @param {object} options
 *   - n (number): if > 1, calculates n-gram frequencies instead of single-word
 *   - stopwords (Array<string>): custom array of words to ignore
 *   - groupBySpeaker (boolean): if true, returns frequency per speaker
 * @returns {object} If groupBySpeaker=false => { "word": count, "word2": count, ... }
 *                   If groupBySpeaker=true => { speakerA: { "word": count, ... }, speakerB: {...}, ... }
 */
function getWordFrequency(transcripts = [], options = {}) {
  logger.info('Calculating word/n-gram frequency...');

  const {
    n = 1,
    stopwords = defaultStopwords,
    groupBySpeaker = false,
  } = options;

  if (!groupBySpeaker) {
    // Single frequency map for the entire set of transcripts
    const freqMap = {};

    transcripts.forEach(seg => {
      const tokens = cleanAndTokenize(seg.text);
      const finalTokens =
        n > 1 ? getNgrams(tokens, n) : tokens;

      finalTokens.forEach(token => {
        // Skip if token is a stopword (for single words only)
        // If n>1, tokens are phrases like "machine learning"
        if (n === 1 && stopwords.includes(token)) return;
        freqMap[token] = (freqMap[token] || 0) + 1;
      });
    });

    return freqMap;
  } else {
    // Frequency map separated by speaker
    const freqMapBySpeaker = {};

    transcripts.forEach(seg => {
      const { speaker } = seg;
      if (!freqMapBySpeaker[speaker]) {
        freqMapBySpeaker[speaker] = {};
      }
      const tokens = cleanAndTokenize(seg.text);
      const finalTokens =
        n > 1 ? getNgrams(tokens, n) : tokens;

      finalTokens.forEach(token => {
        if (n === 1 && stopwords.includes(token)) return;
        freqMapBySpeaker[speaker][token] =
          (freqMapBySpeaker[speaker][token] || 0) + 1;
      });
    });

    return freqMapBySpeaker;
  }
}

/**
 * getKeywords
 * - Returns the top N keywords/phrases across transcripts, ignoring stopwords.
 *   This is essentially a "most frequent words" approach, filtered to exclude stopwords.
 * @param {object} freqMap - output from getWordFrequency (if groupBySpeaker=false)
 * @param {number} limit - how many top keywords to return
 * @returns {Array<object>} e.g. [ { keyword: "apple", count: 10 }, ... ]
 */
function getKeywords(freqMap, limit = 10) {
  logger.info(\`Extracting top \${limit} keywords...\`);

  // freqMap is { "word": count, "anotherWord": count, ... }
  const entries = Object.entries(freqMap);

  // Sort by count descending
  entries.sort((a, b) => b[1] - a[1]);

  // Return the top limit
  const topKeywords = entries.slice(0, limit).map(([word, count]) => ({
    keyword: word,
    count,
  }));

  return topKeywords;
}

module.exports = {
  cleanAndTokenize,
  getNgrams,
  getWordFrequency,
  getKeywords,
};
`,
    },
    {
      path: 'src/utils/globalVariables.js',
      content: `// src/utils/globalVariables.js

// Example: plugin rename mappings
const pluginRenames = [
  {
    pluginId: "pluginId_string_here",
    name: "Automatic Dictionary",
  },
  {
    pluginId: "pluginId_string_here2",
    name: "Connect the Dots",
  },
  // ...add more as needed
];

// Example: emoji list with associated categories
const categoryEmoji = {
  Romance: "🌹",
  Pets: "🐾",
  Star: "⭐",
  // ... etc.
};

// Example: starred memory IDs
const starredMemories = [
  // e.g., "be32019e-36c9-4b5f-8043-092cc2aaf5ce"
];

module.exports = {
  pluginRenames,
  categoryEmoji,
  starredMemories,
};
`,
    },
    {
      path: 'src/scripts/runValidationCheck.js',
      content: `// src/scripts/runValidationCheck.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { validateMemories } = require('../utils/verifyValidData.js');
const { ValidationError } = require('../utils/customErrors.js');

/**
 * runValidationCheck
 * Validates conversations.json against the defined schema.
 */
async function runValidationCheck() {
  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');

    // Read conversations.json
    let rawData;
    try {
      rawData = await fs.readFile(conversationsPath, 'utf-8');
    } catch (readError) {
      logger.error(\`Failed to read conversations.json: \${readError.message}\`);
      throw new ValidationError('Failed to read conversations.json');
    }

    let allMemories;
    try {
      allMemories = JSON.parse(rawData);
    } catch (parseError) {
      logger.error(\`Failed to parse conversations.json: \${parseError.message}\`);
      throw new ValidationError('Invalid JSON format in conversations.json');
    }

    // Validate memories
    const { validMemories, invalidMemories } = validateMemories(allMemories);

    if (invalidMemories.length > 0) {
      logger.warn(\`\${invalidMemories.length} memories failed validation.\`);
      // Optionally, write invalid memories to a separate file
      const invalidPath = path.join(process.cwd(), 'output', 'reports', 'invalidMemories.json');
      await fs.mkdir(path.dirname(invalidPath), { recursive: true });
      await fs.writeFile(invalidPath, JSON.stringify(invalidMemories, null, 2), 'utf-8');
      logger.info(\`Invalid memories written to: \${invalidPath}\`);
      throw new ValidationError('Some memories failed validation. Check invalidMemories.json for details.');
    }

    logger.info('All conversations are valid according to the schema.');
  } catch (error) {
    logger.error(\`runValidationCheck failed: \${error.message}\`);
    throw error; // Rethrow to let the CLI handle it
  }
}

module.exports = {
  runValidationCheck,
};
`,
    },
    {
      path: 'src/scripts/runFiltering.js',
      content: `// src/scripts/runFiltering.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { ValidationError } = require('../utils/customErrors.js');

/**
 * runFiltering
 * Filters out discarded/deleted memories from conversations.json.
 */
async function runFiltering() {
  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');

    // Read conversations.json
    let rawData;
    try {
      rawData = await fs.readFile(conversationsPath, 'utf-8');
    } catch (readError) {
      logger.error(\`Failed to read conversations.json: \${readError.message}\`);
      throw new ValidationError('Failed to read conversations.json');
    }

    let allMemories;
    try {
      allMemories = JSON.parse(rawData);
    } catch (parseError) {
      logger.error(\`Failed to parse conversations.json: \${parseError.message}\`);
      throw new ValidationError('Invalid JSON format in conversations.json');
    }

    // Filter out discarded/deleted
    const filteredMemories = filterNonDiscarded(allMemories);

    // Write back to conversations.json
    try {
      await fs.writeFile(conversationsPath, JSON.stringify(filteredMemories, null, 2), 'utf-8');
      logger.info(\`Filtered conversations.json. Remaining memories: \${filteredMemories.length}\`);
    } catch (writeError) {
      logger.error(\`Failed to write to conversations.json: \${writeError.message}\`);
      throw new ValidationError('Failed to write filtered memories');
    }
  } catch (error) {
    logger.error(\`runFiltering failed: \${error.message}\`);
    throw error; // Rethrow to let the CLI handle it
  }
}

module.exports = {
  runFiltering,
};
`,
    },
    {
      path: 'src/scripts/runWriteCategories.js',
      content: `// src/scripts/runWriteCategories.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { extractCategories } = require('../modules/extractCategories.js');
const { formatCategoriesMarkdown } = require('../utils/formatMarkdown.js');
const { writeJsonToCsv } = require('../utils/writeToCsv.js');
const { ValidationError } = require('../utils/customErrors.js');

/**
 * runWriteCategories
 * Extracts category summaries and writes them to Markdown, JSON, and CSV.
 */
async function runWriteCategories() {
  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');

    // Read and parse conversations.json
    let rawData;
    try {
      rawData = await fs.readFile(conversationsPath, 'utf-8');
    } catch (readError) {
      logger.error(\`Failed to read conversations.json: \${readError.message}\`);
      throw new ValidationError('Failed to read conversations.json');
    }

    let allMemories;
    try {
      allMemories = JSON.parse(rawData);
    } catch (parseError) {
      logger.error(\`Failed to parse conversations.json: \${parseError.message}\`);
      throw new ValidationError('Invalid JSON format in conversations.json');
    }

    // Filter out discarded/deleted
    const activeMemories = filterNonDiscarded(allMemories);

    // Extract categories
    let categoriesSummary;
    try {
      categoriesSummary = extractCategories(activeMemories);
    } catch (extractError) {
      logger.error(\`Failed to extract categories: \${extractError.message}\`);
      throw new MemoryProcessingError('Category extraction failed');
    }

    // Format to Markdown
    let categoriesMarkdown;
    try {
      categoriesMarkdown = formatCategoriesMarkdown(categoriesSummary);
    } catch (formatError) {
      logger.error(\`Failed to format categories to Markdown: \${formatError.message}\`);
      throw new MemoryProcessingError('Markdown formatting failed');
    }

    // Ensure output directories exist
    const outputDirMd = path.join(process.cwd(), 'output', 'markdown');
    const outputDirJson = path.join(process.cwd(), 'output', 'reports');
    const outputDirCsv = path.join(process.cwd(), 'output', 'csv');
    try {
      await fs.mkdir(outputDirMd, { recursive: true });
      await fs.mkdir(outputDirJson, { recursive: true });
      await fs.mkdir(outputDirCsv, { recursive: true });
    } catch (mkdirError) {
      logger.error(\`Failed to create output directories: \${mkdirError.message }\`);
      throw new ValidationError('Directory creation failed');
    }

    // Write to Markdown
    const categoriesMdPath = path.join(outputDirMd, 'categoriesSummary.md');
    try {
      await fs.writeFile(categoriesMdPath, categoriesMarkdown, 'utf-8');
      logger.info(\`Categories summary written to Markdown: \${categoriesMdPath}\`);
    } catch (writeError) {
      logger.error(\`Failed to write categories Markdown: \${writeError.message}\`);
      throw new ValidationError('Failed to write Markdown file');
    }

    // Write to JSON
    const categoriesJsonPath = path.join(outputDirJson, 'categoriesSummary.json');
    try {
      await fs.writeFile(categoriesJsonPath, JSON.stringify(categoriesSummary, null, 2), 'utf-8');
      logger.info(\`Categories summary written to JSON: \${categoriesJsonPath}\`);
    } catch (writeError) {
      logger.error(\`Failed to write categories JSON: \${writeError.message}\`);
      throw new ValidationError('Failed to write JSON file');
    }

    // Write to CSV
    const categoryFields = ['category', 'count', 'emoji'];
    const categoriesCsvPath = path.join(outputDirCsv, 'categoriesSummary.csv');
    try {
      await writeJsonToCsv(categoriesSummary, categoryFields, categoriesCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write categories CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }
  } catch (error) {
    logger.error(\`runWriteCategories failed: \${error.message }\`);
    throw error; // Rethrow to let the CLI handle it
  }
}

module.exports = {
  runWriteCategories,
};
`,
    },
    {
      path: 'src/scripts/runExtractTranscripts.js',
      content: `// src/scripts/runExtractTranscripts.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { extractTranscriptSegments } = require('../modules/extractTranscriptSegments.js');
const { formatTranscriptMarkdown } = require('../utils/formatMarkdown.js');
const { writeJsonToCsv } = require('../utils/writeToCsv.js');
const { validateMemories } = require('../utils/verifyValidData.js');
const { ValidationError, MemoryProcessingError, FileOperationError } = require('../utils/customErrors.js');

/**
 * runExtractTranscripts
 * Extracts transcript segments and writes them to Markdown, JSON, and CSV.
 */
async function runExtractTranscripts() {
  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');

    // Read and parse conversations.json
    let rawData;
    try {
      rawData = await fs.readFile(conversationsPath, 'utf-8');
    } catch (readError) {
      logger.error(\`Failed to read conversations.json: \${readError.message }\`);
      throw new FileOperationError('Failed to read conversations.json');
    }

    let allMemories;
    try {
      allMemories = JSON.parse(rawData);
    } catch (parseError) {
      logger.error(\`Failed to parse conversations.json: \${parseError.message }\`);
      throw new ValidationError('Invalid JSON format in conversations.json');
    }

    // Validate memories
    const { validMemories, invalidMemories } = validateMemories(allMemories);

    if (invalidMemories.length > 0) {
      logger.warn(\`\${invalidMemories.length} memories failed validation and will be skipped.\`);
      // Optionally, log details or write to a separate file
      const invalidPath = path.join(process.cwd(), 'output', 'reports', 'invalidMemories.json');
      await fs.mkdir(path.dirname(invalidPath), { recursive: true });
      await fs.writeFile(invalidPath, JSON.stringify(invalidMemories, null, 2), 'utf-8');
      logger.info(\`Invalid memories written to: \${invalidPath}\`);
    }

    // Proceed with valid memories
    const activeMemories = filterNonDiscarded(validMemories);

    // Extract transcripts
    let transcriptData;
    try {
      transcriptData = extractTranscriptSegments(activeMemories);
    } catch (extractError) {
      logger.error(\`Failed to extract transcripts: \${extractError.message }\`);
      throw new MemoryProcessingError('Transcript extraction failed');
    }

    // Format to Markdown
    let transcriptsMarkdown;
    try {
      transcriptsMarkdown = formatTranscriptMarkdown(transcriptData);
    } catch (formatError) {
      logger.error(\`Failed to format transcripts to Markdown: \${formatError.message }\`);
      throw new MemoryProcessingError('Markdown formatting failed');
    }

    // Ensure output directories exist
    const outputDirMd = path.join(process.cwd(), 'output', 'markdown');
    const outputDirJson = path.join(process.cwd(), 'output', 'reports');
    const outputDirCsv = path.join(process.cwd(), 'output', 'csv');
    try {
      await fs.mkdir(outputDirMd, { recursive: true });
      await fs.mkdir(outputDirJson, { recursive: true });
      await fs.mkdir(outputDirCsv, { recursive: true });
    } catch (mkdirError) {
      logger.error(\`Failed to create output directories: \${mkdirError.message }\`);
      throw new FileOperationError('Directory creation failed');
    }

    // Write to Markdown
    const transcriptsMdPath = path.join(outputDirMd, 'transcripts.md');
    try {
      await fs.writeFile(transcriptsMdPath, transcriptsMarkdown, 'utf-8');
      logger.info(\`Transcripts written to Markdown: \${transcriptsMdPath}\`);
    } catch (writeError) {
      logger.error(\`Failed to write transcripts Markdown: \${writeError.message }\`);
      throw new FileOperationError('Failed to write Markdown file');
    }

    // Write to JSON
    const transcriptsJsonPath = path.join(outputDirJson, 'transcripts.json');
    try {
      await fs.writeFile(transcriptsJsonPath, JSON.stringify(transcriptData, null, 2), 'utf-8');
      logger.info(\`Transcripts written to JSON: \${transcriptsJsonPath}\`);
    } catch (writeError) {
      logger.error(\`Failed to write transcripts JSON: \${writeError.message }\`);
      throw new FileOperationError('Failed to write JSON file');
    }

    // Write to CSV
    const transcriptFields = ['memoryId', 'text', 'speaker', 'speaker_id', 'is_user', 'start', 'end'];
    const flattenedTranscripts = transcriptData.flatMap(mem =>
      mem.transcript.map(seg => ({
        memoryId: mem.memoryId,
        text: seg.text,
        speaker: seg.speaker,
        speaker_id: seg.speaker_id,
        is_user: seg.is_user,
        start: seg.start,
        end: seg.end,
      }))
    );

    const transcriptsCsvPath = path.join(outputDirCsv, 'transcripts.csv');
    try {
      await writeJsonToCsv(flattenedTranscripts, transcriptFields, transcriptsCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write transcripts CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }

  } catch (error) {
    logger.error(\`runExtractTranscripts failed: \${error.message }\`);
    throw error; // Rethrow to let the CLI handle it
  }
}

module.exports = {
  runExtractTranscripts,
};
`,
    },
    {
      path: 'src/scripts/runTextAnalysis.js',
      content: `// src/scripts/runTextAnalysis.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { getWordFrequency, getKeywords } = require('../utils/textAnalysis.js');
const { validateMemories } = require('../utils/verifyValidData.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { writeJsonToCsv } = require('../utils/writeToCsv.js');
const { ValidationError, MemoryProcessingError, FileOperationError } = require('../utils/customErrors.js');

/**
 * runTextAnalysis
 * Performs text analysis on transcripts, including word frequency and keyword extraction.
 */
async function runTextAnalysis() {
  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');

    // Read and parse conversations.json
    let rawData;
    try {
      rawData = await fs.readFile(conversationsPath, 'utf-8');
    } catch (readError) {
      logger.error(\`Failed to read conversations.json: \${readError.message }\`);
      throw new FileOperationError('Failed to read conversations.json');
    }

    let allMemories;
    try {
      allMemories = JSON.parse(rawData);
    } catch (parseError) {
      logger.error(\`Failed to parse conversations.json: \${parseError.message }\`);;;
      throw new ValidationError('Invalid JSON format in conversations.json');
    }

    // Validate memories
    const { validMemories, invalidMemories } = validateMemories(allMemories);

    if (invalidMemories.length > 0) {
      logger.warn(\`\${invalidMemories.length} memories failed validation and will be skipped.\`);
      // Optionally, log details or write to a separate file
      const invalidPath = path.join(process.cwd(), 'output', 'reports', 'invalidMemories.json');
      await fs.mkdir(path.dirname(invalidPath), { recursive: true });
      await fs.writeFile(invalidPath, JSON.stringify(invalidMemories, null, 2), 'utf-8');
      logger.info(\`Invalid memories written to: \${invalidPath}\`);
    }

    // Proceed with valid memories
    const activeMemories = filterNonDiscarded(validMemories);

    // Aggregate all transcript segments
    const allTranscripts = activeMemories.flatMap(mem => mem.transcript_segments || []);

    // Calculate word frequency
    const wordFreq = getWordFrequency(allTranscripts, { n: 1, stopwords: undefined, groupBySpeaker: false });

    // Extract top 10 keywords
    const topKeywords = getKeywords(wordFreq, 10);

    // Format results
    const textAnalysisResults = {
      wordFrequency: wordFreq,
      topKeywords,
    };

    // Ensure output directories exist
    const outputDirJson = path.join(process.cwd(), 'output', 'reports');
    const outputDirCsv = path.join(process.cwd(), 'output', 'csv');
    try {
      await fs.mkdir(outputDirJson, { recursive: true });
      await fs.mkdir(outputDirCsv, { recursive: true });
    } catch (mkdirError) {
      logger.error(\`Failed to create output directories: \${mkdirError.message }\`);
      throw new FileOperationError('Directory creation failed');
    }

    // Write to JSON
    const analysisJsonPath = path.join(outputDirJson, 'textAnalysis.json');
    try {
      await fs.writeFile(analysisJsonPath, JSON.stringify(textAnalysisResults, null, 2), 'utf-8');
      logger.info(\`Text analysis results written to JSON: \${analysisJsonPath}\`);
    } catch (writeError) {
      logger.error(\`Failed to write text analysis JSON: \${writeError.message }\`);
      throw new FileOperationError('Failed to write JSON file');
    }

    // Write to CSV (word frequency)
    const wordFreqFields = ['word', 'count'];
    const wordFreqData = Object.entries(wordFreq).map(([word, count]) => ({ word, count }));
    const wordFreqCsvPath = path.join(outputDirCsv, 'wordFrequency.csv');
    try {
      await writeJsonToCsv(wordFreqData, wordFreqFields, wordFreqCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write word frequency CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }

    // Write to CSV (top keywords)
    const topKeywordsFields = ['keyword', 'count'];
    const topKeywordsCsvPath = path.join(outputDirCsv, 'topKeywords.csv');
    try {
      await writeJsonToCsv(topKeywords, topKeywordsFields, topKeywordsCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write top keywords CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }

  } catch (error) {
    logger.error(\`runTextAnalysis failed: \${error.message }\`);
    throw error; // Rethrow to let the CLI handle it
  }
}

module.exports = {
  runTextAnalysis,
};
`,
    },
    {
      path: 'src/utils/textAnalysis.js',
      content: `// src/utils/textAnalysis.js

const logger = require('../utils/logger.js');
const _ = require('lodash');

// A simple default stopwords list (English example).
// You can expand this or move it to globalVariables.js if you prefer.
const defaultStopwords = [
  'the', 'and', 'of', 'to', 'a', 'i', 'it', 'in', 'is', 'you', 'that', 
  'for', 'on', 'was', 'with', 'as', 'this', 'but', 'be', 'are', 'have',
  'not', 'at', 'or', 'he', 'by', 'from'
];

/**
 * cleanAndTokenize
 * - Lowercases text, removes punctuation (basic approach), splits into tokens.
 * @param {string} text
 * @returns {Array<string>} tokens
 */
function cleanAndTokenize(text) {
  // Convert to lowercase
  let cleaned = text.toLowerCase();

  // Remove punctuation (basic regex approach)
  // This will remove everything that isn't a letter, number, or space.
  cleaned = cleaned.replace(/[^a-z0-9\s]+/gi, '');

  // Split on whitespace
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return tokens;
}

/**
 * getNgrams
 * - Converts an array of tokens into an array of n-grams.
 *   e.g., tokens = ["i", "love", "red", "apples"], n=2 => ["i love", "love red", "red apples"]
 * @param {Array<string>} tokens
 * @param {number} n - e.g., 2 for bigrams, 3 for trigrams
 * @returns {Array<string>}
 */
function getNgrams(tokens, n) {
  const ngrams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * getWordFrequency
 * - Calculates the frequency of each token or n-gram in the transcripts.
 * @param {Array<object>} transcripts - Array of { text, speaker, ... }
 * @param {object} options
 *   - n (number): if > 1, calculates n-gram frequencies instead of single-word
 *   - stopwords (Array<string>): custom array of words to ignore
 *   - groupBySpeaker (boolean): if true, returns frequency per speaker
 * @returns {object} If groupBySpeaker=false => { "word": count, "word2": count, ... }
 *                   If groupBySpeaker=true => { speakerA: { "word": count, ... }, speakerB: {...}, ... }
 */
function getWordFrequency(transcripts = [], options = {}) {
  logger.info('Calculating word/n-gram frequency...');

  const {
    n = 1,
    stopwords = defaultStopwords,
    groupBySpeaker = false,
  } = options;

  if (!groupBySpeaker) {
    // Single frequency map for the entire set of transcripts
    const freqMap = {};

    transcripts.forEach(seg => {
      const tokens = cleanAndTokenize(seg.text);
      const finalTokens =
        n > 1 ? getNgrams(tokens, n) : tokens;

      finalTokens.forEach(token => {
        // Skip if token is a stopword (for single words only)
        // If n>1, tokens are phrases like "machine learning"
        if (n === 1 && stopwords.includes(token)) return;
        freqMap[token] = (freqMap[token] || 0) + 1;
      });
    });

    return freqMap;
  } else {
    // Frequency map separated by speaker
    const freqMapBySpeaker = {};

    transcripts.forEach(seg => {
      const { speaker } = seg;
      if (!freqMapBySpeaker[speaker]) {
        freqMapBySpeaker[speaker] = {};
      }
      const tokens = cleanAndTokenize(seg.text);
      const finalTokens =
        n > 1 ? getNgrams(tokens, n) : tokens;

      finalTokens.forEach(token => {
        if (n === 1 && stopwords.includes(token)) return;
        freqMapBySpeaker[speaker][token] =
          (freqMapBySpeaker[speaker][token] || 0) + 1;
      });
    });

    return freqMapBySpeaker;
  }
}

/**
 * getKeywords
 * - Returns the top N keywords/phrases across transcripts, ignoring stopwords.
 *   This is essentially a "most frequent words" approach, filtered to exclude stopwords.
 * @param {object} freqMap - output from getWordFrequency (if groupBySpeaker=false)
 * @param {number} limit - how many top keywords to return
 * @returns {Array<object>} e.g. [ { keyword: "apple", count: 10 }, ... ]
 */
function getKeywords(freqMap, limit = 10) {
  logger.info(\`Extracting top \${limit} keywords...\`);

  // freqMap is { "word": count, "anotherWord": count, ... }
  const entries = Object.entries(freqMap);

  // Sort by count descending
  entries.sort((a, b) => b[1] - a[1]);

  // Return the top limit
  const topKeywords = entries.slice(0, limit).map(([word, count]) => ({
    keyword: word,
    count,
  }));

  return topKeywords;
}

module.exports = {
  cleanAndTokenize,
  getNgrams,
  getWordFrequency,
  getKeywords,
};
`,
    },
    {
      path: 'src/scripts/runExtractPlugins.js',
      content: `// src/scripts/runExtractPlugins.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { extractPluginResponses } = require('../modules/extractPluginResponses.js');
const { writeJsonToCsv } = require('../utils/writeToCsv.js');
const { ValidationError } = require('../utils/customErrors.js');

/**
 * runExtractPlugins
 * Extracts plugin responses and writes them to JSON and CSV.
 */
async function runExtractPlugins() {
  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');

    // Read conversations.json
    let rawData;
    try {
      rawData = await fs.readFile(conversationsPath, 'utf-8');
    } catch (readError) {
      logger.error(\`Failed to read conversations.json: \${readError.message }\`);
      throw new ValidationError('Failed to read conversations.json');
    }

    let allMemories;
    try {
      allMemories = JSON.parse(rawData);
    } catch (parseError) {
      logger.error(\`Failed to parse conversations.json: \${parseError.message }\`);
      throw new ValidationError('Invalid JSON format in conversations.json');
    }

    // Filter out discarded/deleted
    const activeMemories = filterNonDiscarded(allMemories);

    // Extract plugin responses
    let pluginResponses;
    try {
      pluginResponses = extractPluginResponses(activeMemories);
    } catch (extractError) {
      logger.error(\`Failed to extract plugin responses: \${extractError.message }\`);
      throw new MemoryProcessingError('Plugin response extraction failed');
    }

    // Ensure output directories exist
    const outputDirJson = path.join(process.cwd(), 'output', 'reports');
    const outputDirCsv = path.join(process.cwd(), 'output', 'csv');
    try {
      await fs.mkdir(outputDirJson, { recursive: true });
      await fs.mkdir(outputDirCsv, { recursive: true });
    } catch (mkdirError) {
      logger.error(\`Failed to create output directories: \${mkdirError.message }\`);
      throw new ValidationError('Directory creation failed');
    }

    // Write to JSON
    const pluginsJsonPath = path.join(outputDirJson, 'pluginResponses.json');
    try {
      await fs.writeFile(pluginsJsonPath, JSON.stringify(pluginResponses, null, 2), 'utf-8');
      logger.info(\`Plugin responses written to JSON: \${pluginsJsonPath}\`);
    } catch (writeError) {
      logger.error(\`Failed to write plugin responses JSON: \${writeError.message }\`);;
      throw new ValidationError('Failed to write JSON file');
    }

    // Write to CSV
    const pluginFields = ['memoryId', 'pluginId', 'displayName', 'content'];
    const pluginCsvData = pluginResponses.flatMap(mem =>
      mem.plugins.map(plugin => ({
        memoryId: mem.memoryId,
        pluginId: plugin.pluginId,
        displayName: plugin.displayName,
        content: plugin.content,
      }))
    );
    const pluginsCsvPath = path.join(outputDirCsv, 'pluginResponses.csv');
    try {
      await writeJsonToCsv(pluginCsvData, pluginFields, pluginsCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write plugin responses CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }

  } catch (error) {
    logger.error(\`runExtractPlugins failed: \${{{{{error.message }\`);
    throw error; // Rethrow to let the CLI handle it
  }
}

module.exports = {
  runExtractPlugins,
};
`,
    },
    {
      path: 'src/scripts/runWriteMarkdown.js',
      content: `// src/scripts/runWriteMarkdown.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { formatCategoriesMarkdown, formatTranscriptMarkdown } = require('../utils/formatMarkdown.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { extractCategories } = require('../modules/extractCategories.js');
const { extractTranscriptSegments } = require('../modules/extractTranscriptSegments.js');
const { extractPluginResponses } = require('../modules/extractPluginResponses.js');
const { runTextAnalysis } = require('./runTextAnalysis.js');
const { ValidationError, MemoryProcessingError, FileOperationError } = require('../utils/customErrors.js');

/**
 * runWriteMarkdown
 * Consolidates various extracted data into Markdown reports.
 */
async function runWriteMarkdown() {
  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');

    // Read conversations.json
    let rawData;
    try {
      rawData = await fs.readFile(conversationsPath, 'utf-8');
    } catch (readError) {
      logger.error(\`Failed to read conversations.json: \${readError.message }\`);
      throw new FileOperationError('Failed to read conversations.json');
    }

    let allMemories;
    try {
      allMemories = JSON.parse(rawData);
    } catch (parseError) {
      logger.error(\`Failed to parse conversations.json: \${parseError.message }\`);
      throw new ValidationError('Invalid JSON format in conversations.json');
    }

    // Filter out discarded/deleted
    const activeMemories = filterNonDiscarded(allMemories);

    // Extract categories
    let categoriesSummary;
    try {
      categoriesSummary = extractCategories(activeMemories);
    } catch (extractError) {
      logger.error(\`Failed to extract categories: \${extractError.message }\`);
      throw new MemoryProcessingError('Category extraction failed');
    }

    // Extract transcripts
    let transcriptData;
    try {
      transcriptData = extractTranscriptSegments(activeMemories);
    } catch (extractError) {
      logger.error(\`Failed to extract transcripts: \${extractError.message }\`);
      throw new MemoryProcessingError('Transcript extraction failed');
    }

    // Extract plugin responses
    let pluginResponses;
    try {
      pluginResponses = extractPluginResponses(activeMemories);
    } catch (extractError) {
      logger.error(\`Failed to extract plugin responses: \${extractError.message }\`);
      throw new MemoryProcessingError('Plugin response extraction failed');
    }

    // Perform text analysis (optional, can be skipped if already done)
    // await runTextAnalysis();

    // Format all data into Markdown
    let markdownContent = '# Memories Processing Toolbox Reports\n\n';

    // Categories Summary
    markdownContent += formatCategoriesMarkdown(categoriesSummary);

    // Transcripts
    markdownContent += formatTranscriptMarkdown(transcriptData);

    // Plugin Responses
    markdownContent += '## Plugin Responses\n\n';
    pluginResponses.forEach(mem => {
      markdownContent += \`### Memory ID: \${mem.memoryId}\n\n\`;
      mem.plugins.forEach(plugin => {
        markdownContent += \`**\${plugin.displayName}**: \${plugin.content}\n\n\`;
      });
    });

    // Add more sections as needed

    // Ensure output directory exists
    const outputDirMd = path.join(process.cwd(), 'output', 'markdown');
    try {
      await fs.mkdir(outputDirMd, { recursive: true });
    } catch (mkdirError) {
      logger.error(\`Failed to create output directory: \${mkdirError.message }\`);
      throw new FileOperationError('Directory creation failed');
    }

    // Write to Markdown file
    const markdownPath = path.join(outputDirMd, 'consolidatedReport.md');
    try {
      await fs.writeFile(markdownPath, markdownContent, 'utf-8');
      logger.info(\`Consolidated Markdown report written to: \${markdownPath}\`);
    } catch (writeError) {
      logger.error(\`Failed to write Markdown report: \${writeError.message }\`);
      throw new FileOperationError('Failed to write Markdown file');
    }

  } catch (error) {
    logger.error(\`runWriteMarkdown failed: \${{{error.message }\`);
    throw error; // Rethrow to let the CLI handle it
  }
}

module.exports = {
  runWriteMarkdown,
};
`,
    },
    {
      path: 'src/scripts/runWriteCsv.js',
      content: `// src/scripts/runWriteCsv.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { writeJsonToCsv } = require('../utils/writeToCsv.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { extractTranscriptSegments } = require('../modules/extractTranscriptSegments.js');
const { extractCategories } = require('../modules/extractCategories.js');
const { extractPluginResponses } = require('../modules/extractPluginResponses.js');
const { ValidationError, MemoryProcessingError, FileOperationError } = require('../utils/customErrors.js');

/**
 * runWriteCsv
 * Converts specific data into CSV format and writes to files.
 */
async function runWriteCsv() {
  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');
    const rawData = await fs.readFile(conversationsPath, 'utf-8');
    const allMemories = JSON.parse(rawData);

    // Filter out discarded/deleted
    const activeMemories = filterNonDiscarded(allMemories);

    // Extract data
    const categoriesSummary = extractCategories(activeMemories);
    const transcriptData = extractTranscriptSegments(activeMemories);
    const pluginResponses = extractPluginResponses(activeMemories);

    // Define fields for CSV
    const categoryFields = ['category', 'count', 'emoji'];
    const transcriptFields = ['memoryId', 'text', 'speaker', 'speaker_id', 'is_user', 'start', 'end'];
    const pluginFields = ['memoryId', 'pluginId', 'displayName', 'content'];

    // Flatten transcripts for CSV
    const flattenedTranscripts = transcriptData.flatMap(mem =>
      mem.transcript.map(seg => ({
        memoryId: mem.memoryId,
        text: seg.text,
        speaker: seg.speaker,
        speaker_id: seg.speaker_id,
        is_user: seg.is_user,
        start: seg.start,
        end: seg.end,
      }))
    );

    // Flatten plugin responses for CSV
    const flattenedPlugins = pluginResponses.flatMap(mem =>
      mem.plugins.map(plugin => ({
        memoryId: mem.memoryId,
        pluginId: plugin.pluginId,
        displayName: plugin.displayName,
        content: plugin.content,
      }))
    );

    // Ensure output directories exist
    const outputDir = path.join(process.cwd(), 'output', 'csv');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (mkdirError) {
      logger.error(\`Failed to create output directory: \${mkdirError.message }\`);
      throw new FileOperationError('Directory creation failed');
    }

    // Write Categories CSV
    const categoriesCsvPath = path.join(outputDir, 'categoriesSummary.csv');
    try {
      await writeJsonToCsv(categoriesSummary, categoryFields, categoriesCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write categories CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }

    // Write Transcripts CSV
    const transcriptsCsvPath = path.join(outputDir, 'transcripts.csv');
    try {
      await writeJsonToCsv(flattenedTranscripts, transcriptFields, transcriptsCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write transcripts CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }

    // Write Plugin Responses CSV
    const pluginsCsvPath = path.join(outputDir, 'pluginResponses.csv');
    try {
      await writeJsonToCsv(flattenedPlugins, pluginFields, pluginsCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write plugin responses CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }

  } catch (error) {
    logger.error(\`runWriteCsv failed: \${error.message }\`);
    throw error; // Rethrow to let the CLI handle it
  }
}

module.exports = {
  runWriteCsv,
};
`,
    },
    {
      path: 'src/webhook/webhookServer.js',
      content: `// src/webhook/webhookServer.js

require('dotenv').config(); // Ensure environment variables are loaded

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const logger = require('../utils/logger.js');
const fs = require('fs').promises;
const path = require('path');
const retry = require('async-retry');

// Import your processing scripts
const { runValidationCheck } = require('../scripts/runValidationCheck.js');
const { runFiltering } = require('../scripts/runFiltering.js');
const { runWriteCategories } = require('../scripts/runWriteCategories.js');
const { runExtractTranscripts } = require('../scripts/runExtractTranscripts.js');
const { runTextAnalysis } = require('../scripts/runTextAnalysis.js');
const { runExtractPlugins } = require('../scripts/runExtractPlugins.js');
const { runWriteMarkdown } = require('../scripts/runWriteMarkdown.js');
const { runWriteCsv } = require('../scripts/runWriteCsv.js');

const {
  MemoryProcessingError,
  FileOperationError,
  ValidationError,
} = require('../utils/customErrors.js');

// Initialize Express App
const app = express();

// Webhook Secret from environment variables
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  logger.error('WEBHOOK_SECRET is not defined in environment variables.');
  process.exit(1); // Exit the application if secret is missing
}

// Middleware to verify signature
function verifySignature(req, res, buf, encoding) {
  const signature = req.headers['x-webhook-signature'];
  if (!signature) {
    throw new MemoryProcessingError('No signature found in headers');
  }

  const hash = crypto.createHmac('sha256', WEBHOOK_SECRET)
                     .update(buf)
                     .digest('hex');

  if (hash !== signature) {
    throw new MemoryProcessingError('Invalid signature');
  }
}

// Use raw body parser with verification
app.use(bodyParser.json({
  verify: verifySignature
}));

// Error-handling middleware for body-parser
app.use((err, req, res, next) => {
  if (err) {
    if (err instanceof MemoryProcessingError) {
      logger.error(\`Webhook signature verification failed: \${err.message }\`);
      return res.status(401).send('Unauthorized');
    }
    logger.error(\`Error parsing request body: \${err.message }\`);
    return res.status(400).send('Invalid request body');
  }
  next();
});

// Define the webhook endpoint
app.post('/webhook', async (req, res) => {
  const event = req.body;

  logger.info('Received webhook event:', JSON.stringify(event, null, 2));

  try {
    // Validate event structure (implement as needed)
    await handleNewConversationEvent(event);

    // Trigger processing scripts
    await runProcessingTasks();

    // Respond to acknowledge receipt
    res.status(200).send('Event received and processed');
  } catch (error) {
    logger.error('Error processing webhook event:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * Function to handle new conversation events with retries
 * @param {Object} event - The webhook event payload
 */
async function handleNewConversationEvent(event) {
  const memory = event.memory;

  if (!memory) {
    throw new ValidationError('Invalid event data: Missing memory object');
  }

  const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');

  // Retryable file operations
  await retry(async (bail) => {
    // Read existing conversations
    let conversations = [];
    try {
      // Check if file exists
      await fs.access(conversationsPath);
      const rawData = await fs.readFile(conversationsPath, 'utf-8');
      conversations = JSON.parse(rawData);
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        // File does not exist, start with empty array
        conversations = [];
        logger.warn('conversations.json does not exist. Starting with an empty array.');
      } else {
        logger.error(\`Failed to read conversations.json: \${fileError.message }\`);
        throw new FileOperationError('Failed to read conversations.json');
      }
    }

    // Add the new memory
    conversations.push(memory);

    // Write back to conversations.json
    try {
      await fs.writeFile(conversationsPath, JSON.stringify(conversations, null, 2), 'utf-8');
      logger.info(\`New memory added with ID: \${memory.id}\`);
    } catch (writeError) {
      logger.error(\`Failed to write to conversations.json: \${writeError.message }\`);
      throw new FileOperationError('Failed to write new memory');
    }
  }, {
    retries: 3,
    minTimeout: 1000,
    onRetry: (error, attempt) => {
      logger.warn(\`Retrying due to error: \${error.message}. Attempt \${attempt}\`);
    }
  });
}

/**
 * Function to run all processing scripts sequentially
 */
async function runProcessingTasks() {
  try {
    await runValidationCheck();
    await runFiltering();
    await runWriteCategories();
    await runExtractTranscripts();
    await runTextAnalysis();
    await runExtractPlugins();
    await runWriteMarkdown();
    await runWriteCsv();
    logger.info('All processing tasks completed successfully.');
  } catch (taskError) {
    logger.error(\`Processing tasks failed: \${taskError.message}\`);
    throw new MemoryProcessingError('Processing tasks failed');
  }
}

/**
 * Function to handle graceful shutdown
 * @param {string} signal - The signal received
 */
function gracefulShutdown(signal) {
  logger.info(\`Received \${signal}. Shutting down gracefully...\`);

  server.close(() => {
    logger.info('Closed out remaining connections.');
    process.exit(0);
  });

  // Force shutdown after a timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000); // 10 seconds
}

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Global error handlers to catch unhandled promise rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally, perform cleanup or alerting
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  // Optionally, perform cleanup or alerting
  process.exit(1); // Exit the process to avoid unknown state
});

// Start the server
const PORT = process.env.WEBHOOK_PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(\`Webhook server is listening on port \${PORT}\`);
});
`,
    },
    {
      path: 'src/scripts/index.js',
      content: `// src/scripts/index.js

const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const logger = require('../utils/logger.js');

// Import the script functions (now async or Promise-based)
const { runValidationCheck } = require('./runValidationCheck.js');
const { runFiltering } = require('./runFiltering.js');
const { runWriteCategories } = require('./runWriteCategories.js');
const { runExtractTranscripts } = require('./runExtractTranscripts.js');
const { runTextAnalysis } = require('./runTextAnalysis.js');
const { runExtractPlugins } = require('./runExtractPlugins.js');
const { runWriteMarkdown } = require('./runWriteMarkdown.js');
const { runWriteCsv } = require('./runWriteCsv.js');

/**
 * Helper to run a script function with an ora spinner.
 * 
 * @param {Function} scriptFn - the function to run (async or Promise-based)
 * @param {string} message - the spinner text displayed while running
 * @returns {Promise<void>}
 */
async function runWithSpinner(scriptFn, message) {
  const spinner = ora({ text: message, color: 'cyan' }).start();
  try {
    await scriptFn();  // run the actual script
    spinner.succeed(chalk.green(\`\${message} - Completed!\`));
  } catch (err) {
    spinner.fail(chalk.red(\`\${message} - Failed!\`));
    logger.error(err.message);
    // Optionally, display additional error information to the user
    console.error(chalk.red(\`Error: \${err.message}\`));
  }
}

/**
 * runAllTasks
 * Demonstrates running all tasks in a specific sequence, 
 * awaiting each one before moving to the next.
 */
async function runAllTasks() {
  logger.info(chalk.yellow('Running all tasks in sequence...'));
  try {
    await runWithSpinner(runValidationCheck, '1) Validating conversations');
    await runWithSpinner(runFiltering, '2) Filtering memories');
    await runWithSpinner(runWriteCategories, '3) Extracting categories');
    await runWithSpinner(runExtractTranscripts, '4) Extracting transcripts');
    await runWithSpinner(runTextAnalysis, '5) Performing text analysis');
    await runWithSpinner(runExtractPlugins, '6) Extracting plugin responses');
    await runWithSpinner(runWriteMarkdown, '7) Writing Markdown outputs');
    await runWithSpinner(runWriteCsv, '8) Writing CSV outputs');
    logger.info(chalk.magenta('All tasks completed successfully!'));
  } catch (error) {
    logger.error(\`runAllTasks failed: \${error.message}\`);
    console.error(chalk.red('One or more tasks failed. Check logs for details.'));
  }
}

/**
 * mainMenu
 * Displays a menu of available tasks using Inquirer,
 * then runs the chosen function (with spinners and color).
 */
async function mainMenu() {
  logger.info(chalk.bold.blue('Welcome to the memories-processing-toolbox CLI!'));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'task',
      message: chalk.yellow('Which task would you like to run?'),
      choices: [
        { name: 'Validate Conversations (Schema Check)', value: 'validate' },
        { name: 'Filter Discarded/Deleted Memories', value: 'filter' },
        { name: 'Extract Categories', value: 'categories' },
        { name: 'Extract Transcripts', value: 'transcripts' },
        { name: 'Perform Text Analysis (word freq, keywords)', value: 'textAnalysis' },
        { name: 'Extract Plugin Responses', value: 'plugins' },
        { name: 'Write Markdown Outputs', value: 'markdown' },
        { name: 'Write CSV Outputs', value: 'csv' },
        new inquirer.Separator(),
        { name: 'Run ALL tasks in sequence', value: 'all' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);

  switch (answers.task) {
    case 'validate':
      await runWithSpinner(runValidationCheck, 'Validating conversations');
      break;
    case 'filter':
      await runWithSpinner(runFiltering, 'Filtering memories');
      break;
    case 'categories':
      await runWithSpinner(runWriteCategories, 'Extracting categories');
      break;
    case 'transcripts':
      await runWithSpinner(runExtractTranscripts, 'Extracting transcripts');
      break;
    case 'textAnalysis':
      await runWithSpinner(runTextAnalysis, 'Performing text analysis');
      break;
    case 'plugins':
      await runWithSpinner(runExtractPlugins, 'Extracting plugin responses');
      break;
    case 'markdown':
      await runWithSpinner(runWriteMarkdown, 'Writing Markdown outputs');
      break;
    case 'csv':
      await runWithSpinner(runWriteCsv, 'Writing CSV outputs');
      break;
    case 'all':
      await runAllTasks();
      break;
    case 'exit':
      logger.info(chalk.cyan('Exiting CLI...'));
      return;
    default:
      logger.warn('Unknown option selected. Exiting.');
      return;
  }

  // Re-run the menu for continuous interaction
  await mainMenu();
}

module.exports = {
  mainMenu,
};
`,
    },
    {
      path: 'src/utils/textAnalysis.js',
      content: `// src/utils/textAnalysis.js

const logger = require('../utils/logger.js');
const _ = require('lodash');

// A simple default stopwords list (English example).
// You can expand this or move it to globalVariables.js if you prefer.
const defaultStopwords = [
  'the', 'and', 'of', 'to', 'a', 'i', 'it', 'in', 'is', 'you', 'that', 
  'for', 'on', 'was', 'with', 'as', 'this', 'but', 'be', 'are', 'have',
  'not', 'at', 'or', 'he', 'by', 'from'
];

/**
 * cleanAndTokenize
 * - Lowercases text, removes punctuation (basic approach), splits into tokens.
 * @param {string} text
 * @returns {Array<string>} tokens
 */
function cleanAndTokenize(text) {
  // Convert to lowercase
  let cleaned = text.toLowerCase();

  // Remove punctuation (basic regex approach)
  // This will remove everything that isn't a letter, number, or space.
  cleaned = cleaned.replace(/[^a-z0-9\s]+/gi, '');

  // Split on whitespace
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return tokens;
}

/**
 * getNgrams
 * - Converts an array of tokens into an array of n-grams.
 *   e.g., tokens = ["i", "love", "red", "apples"], n=2 => ["i love", "love red", "red apples"]
 * @param {Array<string>} tokens
 * @param {number} n - e.g., 2 for bigrams, 3 for trigrams
 * @returns {Array<string>}
 */
function getNgrams(tokens, n) {
  const ngrams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * getWordFrequency
 * - Calculates the frequency of each token or n-gram in the transcripts.
 * @param {Array<object>} transcripts - Array of { text, speaker, ... }
 * @param {object} options
 *   - n (number): if > 1, calculates n-gram frequencies instead of single-word
 *   - stopwords (Array<string>): custom array of words to ignore
 *   - groupBySpeaker (boolean): if true, returns frequency per speaker
 * @returns {object} If groupBySpeaker=false => { "word": count, "word2": count, ... }
 *                   If groupBySpeaker=true => { speakerA: { "word": count, ... }, speakerB: {...}, ... }
 */
function getWordFrequency(transcripts = [], options = {}) {
  logger.info('Calculating word/n-gram frequency...');

  const {
    n = 1,
    stopwords = defaultStopwords,
    groupBySpeaker = false,
  } = options;

  if (!groupBySpeaker) {
    // Single frequency map for the entire set of transcripts
    const freqMap = {};

    transcripts.forEach(seg => {
      const tokens = cleanAndTokenize(seg.text);
      const finalTokens =
        n > 1 ? getNgrams(tokens, n) : tokens;

      finalTokens.forEach(token => {
        // Skip if token is a stopword (for single words only)
        // If n>1, tokens are phrases like "machine learning"
        if (n === 1 && stopwords.includes(token)) return;
        freqMap[token] = (freqMap[token] || 0) + 1;
      });
    });

    return freqMap;
  } else {
    // Frequency map separated by speaker
    const freqMapBySpeaker = {};

    transcripts.forEach(seg => {
      const { speaker } = seg;
      if (!freqMapBySpeaker[speaker]) {
        freqMapBySpeaker[speaker] = {};
      }
      const tokens = cleanAndTokenize(seg.text);
      const finalTokens =
        n > 1 ? getNgrams(tokens, n) : tokens;

      finalTokens.forEach(token => {
        if (n === 1 && stopwords.includes(token)) return;
        freqMapBySpeaker[speaker][token] =
          (freqMapBySpeaker[speaker][token] || 0) + 1;
      });
    });

    return freqMapBySpeaker;
  }
}

/**
 * getKeywords
 * - Returns the top N keywords/phrases across transcripts, ignoring stopwords.
 *   This is essentially a "most frequent words" approach, filtered to exclude stopwords.
 * @param {object} freqMap - output from getWordFrequency (if groupBySpeaker=false)
 * @param {number} limit - how many top keywords to return
 * @returns {Array<object>} e.g. [ { keyword: "apple", count: 10 }, ... ]
 */
function getKeywords(freqMap, limit = 10) {
  logger.info(\`Extracting top \${limit} keywords...\`);

  // freqMap is { "word": count, "anotherWord": count, ... }
  const entries = Object.entries(freqMap);

  // Sort by count descending
  entries.sort((a, b) => b[1] - a[1]);

  // Return the top limit
  const topKeywords = entries.slice(0, limit).map(([word, count]) => ({
    keyword: word,
    count,
  }));

  return topKeywords;
}

module.exports = {
  cleanAndTokenize,
  getNgrams,
  getWordFrequency,
  getKeywords,
};
`,
    },
    {
      path: 'src/scripts/runExtractPlugins.js',
      content: `// src/scripts/runExtractPlugins.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { extractPluginResponses } = require('../modules/extractPluginResponses.js');
const { writeJsonToCsv } = require('../utils/writeToCsv.js');
const { ValidationError } = require('../utils/customErrors.js');

/**
 * runExtractPlugins
 * Extracts plugin responses and writes them to JSON and CSV.
 */
async function runExtractPlugins() {
  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');

    // Read conversations.json
    let rawData;
    try {
      rawData = await fs.readFile(conversationsPath, 'utf-8');
    } catch (readError) {
      logger.error(\`Failed to read conversations.json: \${readError.message }\`);
      throw new ValidationError('Failed to read conversations.json');
    }

    let allMemories;
    try {
      allMemories = JSON.parse(rawData);
    } catch (parseError) {
      logger.error(\`Failed to parse conversations.json: \${parseError.message }\`);
      throw new ValidationError('Invalid JSON format in conversations.json');
    }

    // Filter out discarded/deleted
    const activeMemories = filterNonDiscarded(allMemories);

    // Extract plugin responses
    let pluginResponses;
    try {
      pluginResponses = extractPluginResponses(activeMemories);
    } catch (extractError) {
      logger.error(\`Failed to extract plugin responses: \${{extractError.message }\`);
      throw new MemoryProcessingError('Plugin response extraction failed');
    }

    // Ensure output directories exist
    const outputDirJson = path.join(process.cwd(), 'output', 'reports');
    const outputDirCsv = path.join(process.cwd(), 'output', 'csv');
    try {
      await fs.mkdir(outputDirJson, { recursive: true });
      await fs.mkdir(outputDirCsv, { recursive: true });
    } catch (mkdirError) {
      logger.error(\`Failed to create output directories: \${mkdirError.message }\`);
      throw new ValidationError('Directory creation failed');
    }

    // Write to JSON
    const pluginsJsonPath = path.join(outputDirJson, 'pluginResponses.json');
    try {
      await fs.writeFile(pluginsJsonPath, JSON.stringify(pluginResponses, null, 2), 'utf-8');
      logger.info(\`Plugin responses written to JSON: \${pluginsJsonPath}\`);
    } catch (writeError) {
      logger.error(\`Failed to write plugin responses JSON: \${writeError.message }\`);
      throw new ValidationError('Failed to write JSON file');
    }

    // Write to CSV
    const pluginFields = ['memoryId', 'pluginId', 'displayName', 'content'];
    const pluginCsvData = pluginResponses.flatMap(mem =>
      mem.plugins.map(plugin => ({
        memoryId: mem.memoryId,
        pluginId: plugin.pluginId,
        displayName: plugin.displayName,
        content: plugin.content,
      }))
    );
    const pluginsCsvPath = path.join(outputDirCsv, 'pluginResponses.csv');
    try {
      await writeJsonToCsv(pluginCsvData, pluginFields, pluginsCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write plugin responses CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }

  } catch (error) {
    logger.error(\`runExtractPlugins failed: \${error.message }\`);
    throw error; // Rethrow to let the CLI handle it
  }
}

module.exports = {
  runExtractPlugins,
};
`,
    },
    {
      path: 'src/scripts/runWriteMarkdown.js',
      content: `// src/scripts/runWriteMarkdown.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { formatCategoriesMarkdown, formatTranscriptMarkdown } = require('../utils/formatMarkdown.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { extractCategories } = require('../modules/extractCategories.js');
const { extractTranscriptSegments } = require('../modules/extractTranscriptSegments.js');
const { extractPluginResponses } = require('../modules/extractPluginResponses.js');
const { runTextAnalysis } = require('./runTextAnalysis.js');
const { ValidationError, MemoryProcessingError, FileOperationError } = require('../utils/customErrors.js');

/**
 * runWriteMarkdown
 * Consolidates various extracted data into Markdown reports.
 */
async function runWriteMarkdown() {
  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');

    // Read conversations.json
    let rawData;
    try {
      rawData = await fs.readFile(conversationsPath, 'utf-8');
    } catch (readError) {
      logger.error(\`Failed to read conversations.json: \${readError.message }\`);
      throw new FileOperationError('Failed to read conversations.json');
    }

    let allMemories;
    try {
      allMemories = JSON.parse(rawData);
    } catch (parseError) {
      logger.error(\`Failed to parse conversations.json: \${parseError.message }\`);
      throw new ValidationError('Invalid JSON format in conversations.json');
    }

    // Filter out discarded/deleted
    const activeMemories = filterNonDiscarded(allMemories);

    // Extract categories
    let categoriesSummary;
    try {
      categoriesSummary = extractCategories(activeMemories);
    } catch (extractError) {
      logger.error(\`Failed to extract categories: \${extractError.message }\`);
      throw new MemoryProcessingError('Category extraction failed');
    }

    // Extract transcripts
    let transcriptData;
    try {
      transcriptData = extractTranscriptSegments(activeMemories);
    } catch (extractError) {
      logger.error(\`Failed to extract transcripts: \${extractError.message }\`);
      throw new MemoryProcessingError('Transcript extraction failed');
    }

    // Extract plugin responses
    let pluginResponses;
    try {
      pluginResponses = extractPluginResponses(activeMemories);
    } catch (extractError) {
      logger.error(\`Failed to extract plugin responses: \${extractError.message }\`);
      throw new MemoryProcessingError('Plugin response extraction failed');
    }

    // Perform text analysis (optional, can be skipped if already done)
    // await runTextAnalysis();

    // Format all data into Markdown
    let markdownContent = '# Memories Processing Toolbox Reports\n\n';

    // Categories Summary
    markdownContent += formatCategoriesMarkdown(categoriesSummary);

    // Transcripts
    markdownContent += formatTranscriptMarkdown(transcriptData);

    // Plugin Responses
    markdownContent += '## Plugin Responses\n\n';
    pluginResponses.forEach(mem => {
      markdownContent += \`### Memory ID: \${mem.memoryId}\n\n\`;
      mem.plugins.forEach(plugin => {
        markdownContent += \`**\${plugin.displayName}**: \${plugin.content}\n\n\`;
      });
    });

    // Add more sections as needed

    // Ensure output directory exists
    const outputDirMd = path.join(process.cwd(), 'output', 'markdown');
    try {
      await fs.mkdir(outputDirMd, { recursive: true });
    } catch (mkdirError) {
      logger.error(\`Failed to create output directory: \${mkdirError.message }\`);
      throw new FileOperationError('Directory creation failed');
    }

    // Write to Markdown file
    const markdownPath = path.join(outputDirMd, 'consolidatedReport.md');
    try {
      await fs.writeFile(markdownPath, markdownContent, 'utf-8');
      logger.info(\`Consolidated Markdown report written to: \${markdownPath}\`);
    } catch (writeError) {
      logger.error(\`Failed to write Markdown report: \${writeError.message }\`);
      throw new FileOperationError('Failed to write Markdown file');
    }

  } catch (error) {
    logger.error(\`runWriteMarkdown failed: \${error.message }\`);
    throw error; // Rethrow to let the CLI handle it
  }
}

module.exports = {
  runWriteMarkdown,
};
`,
    },
    {
      path: 'src/scripts/runWriteCsv.js',
      content: `// src/scripts/runWriteCsv.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { writeJsonToCsv } = require('../utils/writeToCsv.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { extractTranscriptSegments } = require('../modules/extractTranscriptSegments.js');
const { extractCategories } = require('../modules/extractCategories.js');
const { extractPluginResponses } = require('../modules/extractPluginResponses.js');
const { ValidationError, MemoryProcessingError, FileOperationError } = require('../utils/customErrors.js');

/**
 * runWriteCsv
 * Converts specific data into CSV format and writes to files.
 */
async function runWriteCsv() {
  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'conversations.json');
    const rawData = await fs.readFile(conversationsPath, 'utf-8');
    const allMemories = JSON.parse(rawData);

    // Filter out discarded/deleted
    const activeMemories = filterNonDiscarded(allMemories);

    // Extract data
    const categoriesSummary = extractCategories(activeMemories);
    const transcriptData = extractTranscriptSegments(activeMemories);
    const pluginResponses = extractPluginResponses(activeMemories);

    // Define fields for CSV
    const categoryFields = ['category', 'count', 'emoji'];
    const transcriptFields = ['memoryId', 'text', 'speaker', 'speaker_id', 'is_user', 'start', 'end'];
    const pluginFields = ['memoryId', 'pluginId', 'displayName', 'content'];

    // Flatten transcripts for CSV
    const flattenedTranscripts = transcriptData.flatMap(mem =>
      mem.transcript.map(seg => ({
        memoryId: mem.memoryId,
        text: seg.text,
        speaker: seg.speaker,
        speaker_id: seg.speaker_id,
        is_user: seg.is_user,
        start: seg.start,
        end: seg.end,
      }))
    );

    // Flatten plugin responses for CSV
    const flattenedPlugins = pluginResponses.flatMap(mem =>
      mem.plugins.map(plugin => ({
        memoryId: mem.memoryId,
        pluginId: plugin.pluginId,
        displayName: plugin.displayName,
        content: plugin.content,
      }))
    );

    // Ensure output directories exist
    const outputDir = path.join(process.cwd(), 'output', 'csv');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (mkdirError) {
      logger.error(\`Failed to create output directory: \${mkdirError.message }\`);
      throw new FileOperationError('Directory creation failed');
    }

    // Write Categories CSV
    const categoriesCsvPath = path.join(outputDir, 'categoriesSummary.csv');
    try {
      await writeJsonToCsv(categoriesSummary, categoryFields, categoriesCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write categories CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }

    // Write Transcripts CSV
    const transcriptsCsvPath = path.join(outputDir, 'transcripts.csv');
    try {
      await writeJsonToCsv(flattenedTranscripts, transcriptFields, transcriptsCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write transcripts CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }

    // Write Plugin Responses CSV
    const pluginsCsvPath = path.join(outputDir, 'pluginResponses.csv');
    try {
      await writeJsonToCsv(flattenedPlugins, pluginFields, pluginsCsvPath);
    } catch (csvError) {
      logger.error(\`Failed to write plugin responses CSV: \${csvError.message }\`);
      throw new ValidationError('Failed to write CSV file');
    }

  } catch (error) {
    logger.error(\`runWriteCsv failed: \${error.message }\`);
    throw error; // Rethrow to let the CLI handle it
  }
}

module.exports = {
  runWriteCsv,
};
`,
    },
    // You can continue adding more scripts as needed following the same pattern
  ];

  // Create and write files
  for (const file of files) {
    const filePath = path.join(projectRoot, file.path);
    await createFile(filePath, file.content);
  }

  // Optionally, create a sample conversations.json
  const sampleConversationsPath = path.join(projectRoot, 'src', 'data', 'conversations.json');
  const sampleConversationsContent = `[
  {
    "id": "be32019e-36c9-4b5f-8043-092cc2aaf5ce",
    "created_at": "2025-01-01T10:00:00Z",
    "structured": {
      "title": "Sample Conversation",
      "overview": "This is a sample conversation.",
      "emoji": "💬",
      "category": "Technology",
      "actionItems": ["Review project setup", "Implement webhook"],
      "events": [
        {
          "title": "Kickoff Meeting",
          "starts_at": "2025-01-01T09:00:00Z",
          "duration": 60,
          "description": "Initial project kickoff.",
          "created": true
        }
      ]
    },
    "started_at": "2025-01-01T09:00:00Z",
    "finished_at": "2025-01-01T10:00:00Z",
    "transcript_segments": [
      {
        "text": "Hello, how are you?",
        "speaker": "SPEAKER_1",
        "speaker_id": 1,
        "is_user": true,
        "start": 0,
        "end": 5
      },
      {
        "text": "I'm good, thank you!",
        "speaker": "SPEAKER_2",
        "speaker_id": 2,
        "is_user": false,
        "start": 6,
        "end": 10
      }
    ],
    "plugins_results": [
      {
        "pluginId": "plugin123",
        "content": "Plugin content here."
      }
    ],
    "geolocation": null,
    "photos": [],
    "discarded": false,
    "deleted": false,
    "source": "ConversationSource.friend",
    "language": "en",
    "external_data": null,
    "status": "active"
  }
]
`;
  await createFile(sampleConversationsPath, sampleConversationsContent);

  // Optionally, create a sample .env file
  const envPath = path.join(projectRoot, '.env');
  const envContent = `# .env

WEBHOOK_SECRET=your_super_secret_key
WEBHOOK_PORT=3000
DEBUG=true
`;
  await createFile(envPath, envContent);

  console.log(chalk.blue.bold('\\nProject scaffolding completed successfully!\\n'));
  console.log(chalk.blue('Next Steps:'));
  console.log(chalk.blue('1. Review and update the sample conversations.json as needed.'));
  console.log(chalk.blue('2. Set your WEBHOOK_SECRET in the .env file.'));
  console.log(chalk.blue('3. Install any additional dependencies if required.'));
  console.log(chalk.blue('4. Start the webhook server and CLI using the provided scripts.'));
}

// Execute the scaffolding
scaffoldProject();
