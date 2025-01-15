// src/utils/formatMarkdown.js

const logger = require('./logger.js');

/**
 * formatCategoriesMarkdown
 * Formats category summaries into Markdown tables.
 * @param {Array} categories - Array of objects { category, count, emoji }
 * @returns {string} - Markdown formatted string
 * @throws {Error} If categories is not a valid array or objects lack required properties.
 */
function formatCategoriesMarkdown(categories = []) {
  logger.info('formatCategoriesMarkdown: Starting formatting of categories into Markdown.');

  // Input Validation
  if (!Array.isArray(categories)) {
    const errorMsg = 'formatCategoriesMarkdown: Invalid input - categories should be an array.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (categories.length === 0) {
    logger.warn('formatCategoriesMarkdown: The categories array is empty. No Markdown table to generate.');
    return '## Categories Summary\n\n_No categories available._\n\n';
  }

  // Validate each category object
  categories.forEach((cat, index) => {
    if (
      !cat ||
      typeof cat.category !== 'string' ||
      typeof cat.count !== 'number' ||
      typeof cat.emoji !== 'string'
    ) {
      logger.warn(`formatCategoriesMarkdown: Invalid category object at index ${index}. Expected properties: category (string), count (number), emoji (string).`);
    }
  });

  // Start building the Markdown string
  let markdown = '## Categories Summary\n\n';
  markdown += '| Category | Count | Emoji |\n';
  markdown += '|----------|-------|-------|\n';

  categories.forEach(cat => {
    // Sanitize inputs to prevent Markdown injection
    const category = sanitizeMarkdown(cat.category);
    const count = cat.count;
    const emoji = sanitizeMarkdown(cat.emoji);

    markdown += `| ${category} | ${count} | ${emoji} |\n`;
  });

  markdown += '\n';

  logger.info('formatCategoriesMarkdown: Successfully formatted categories into Markdown.');
  return markdown;
}

/**
 * formatTranscriptMarkdown
 * Formats transcript segments into Markdown tables grouped by memory ID.
 * @param {Array} transcripts - Array of objects { memoryId, transcript: [ { text, speaker, ... } ] }
 * @returns {string} - Markdown formatted string
 * @throws {Error} If transcripts is not a valid array or objects lack required properties.
 */
function formatTranscriptMarkdown(transcripts = []) {
  logger.info('formatTranscriptMarkdown: Starting formatting of transcripts into Markdown.');

  // Input Validation
  if (!Array.isArray(transcripts)) {
    const errorMsg = 'formatTranscriptMarkdown: Invalid input - transcripts should be an array.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (transcripts.length === 0) {
    logger.warn('formatTranscriptMarkdown: The transcripts array is empty. No Markdown tables to generate.');
    return '## Transcripts\n\n_No transcripts available._\n\n';
  }

  let markdown = '## Transcripts\n\n';

  transcripts.forEach(mem => {
    // Validate memory object
    if (
      !mem ||
      typeof mem.memoryId !== 'string' ||
      !Array.isArray(mem.transcript)
    ) {
      logger.warn(`formatTranscriptMarkdown: Invalid memory object for memoryId ${mem?.memoryId || 'unknown'}. Expected properties: memoryId (string), transcript (array).`);
      return; // Skip invalid memory
    }

    markdown += `### Memory ID: ${sanitizeMarkdown(mem.memoryId)}\n\n`;
    markdown += '| Speaker | Text | Start (s) | End (s) |\n';
    markdown += '|---------|------|-----------|---------|\n';

    mem.transcript.forEach(seg => {
      // Validate segment object
      if (
        !seg ||
        typeof seg.speaker !== 'string' ||
        typeof seg.text !== 'string' ||
        typeof seg.start !== 'number' ||
        typeof seg.end !== 'number'
      ) {
        logger.warn(`formatTranscriptMarkdown: Invalid transcript segment in memoryId ${mem.memoryId}. Expected properties: speaker (string), text (string), start (number), end (number).`);
        return; // Skip invalid segment
      }

      const speaker = sanitizeMarkdown(seg.speaker);
      const text = sanitizeMarkdown(seg.text);
      const start = seg.start;
      const end = seg.end;

      markdown += `| ${speaker} | ${text} | ${start} | ${end} |\n`;
    });

    markdown += '\n';
  });

  logger.info('formatTranscriptMarkdown: Successfully formatted transcripts into Markdown.');
  return markdown;
}

/**
 * sanitizeMarkdown
 * Sanitizes input strings to prevent Markdown injection.
 * @param {string} text - The input string to sanitize.
 * @returns {string} - Sanitized string safe for Markdown.
 */
function sanitizeMarkdown(text = '') {
  if (typeof text !== 'string') {
    return '';
  }
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

module.exports = {
  formatCategoriesMarkdown,
  formatTranscriptMarkdown,
};
