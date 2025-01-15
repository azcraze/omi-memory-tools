// src/modules/textAnalysis.js

const logger = require('../utils/logger.js');
const _ = require('lodash');

/**
 * defaultStopwords
 * A comprehensive English stopwords list. Converted to a Set for efficient lookup.
 */
const defaultStopwords = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between",
  "both", "but", "by", "can't", "cannot", "could", "couldn't", "couldnt", "did", "didn't",
  "does", "doesn't", "don't", "down", "during", "each", "few", "for",
  "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't",
  "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers",
  "herself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in",
  "into", "is", "isn't", "it", "it's", "it'd", "it'll", "itself",
  "let's", "me", "mine", "more", "most", "mustn't", "my", "myself",
  "much", "neither", "not", "no", "nor", "or", "our", "ours", "ourselves", "out", "outside", "over",
  "own", "same", "should", "shouldn't",
  "such", "that", "that'll", "that's", "the", "they", "they'd", "they'll", "they're", "they've", "this", "those", "to",
  "together", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd",
  "we'll", "we're", "we've", "were", "what", "what's", "when", "when's", "where", "where's",
  "which", "while", "who", "who's", "whose", "why", "why's", "with", "won't", "would", "wouldn't",
  "you", "you'd", "you'll", "you're", "you've", "your", "yourself",
  "yours", "yourselves"
]);

/**
 * sanitizeText
 * Sanitizes input text by removing unwanted characters and handling edge cases.
 * @param {string} text - The input text to sanitize.
 * @returns {string} - Sanitized text.
 */
function sanitizeText(text = '') {
  // Remove URLs
  let sanitized = text.replace(/https?:\/\/\S+/gi, '');

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized.trim();
}

/**
 * cleanAndTokenize
 * - Lowercases text, removes punctuation (except apostrophes), splits into tokens.
 * @param {string} text
 * @returns {Array<string>} tokens
 */
function cleanAndTokenize(text) {
  // Sanitize text
  let cleaned = sanitizeText(text);

  // Convert to lowercase
  cleaned = cleaned.toLowerCase();

  // Remove punctuation except apostrophes
  cleaned = cleaned.replace(/[^a-z0-9\s']/g, '');

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
  if (n < 1) {
    logger.warn(`getNgrams: Invalid n value (${n}). Returning empty array.`);
    return [];
  }
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
 *   - stopwords (Set<string>): custom set of words to ignore
 *   - groupBySpeaker (boolean): if true, returns frequency per speaker
 * @returns {object} If groupBySpeaker=false => { "word": count, "word2": count, ... }
 *                   If groupBySpeaker=true => { speakerA: { "word": count, ... }, speakerB: {...}, ... }
 */
function getWordFrequency(transcripts = [], options = {}) {
  const {
    n = 1,
    stopwords = defaultStopwords,
    groupBySpeaker = false,
  } = options;

  logger.info(`getWordFrequency: Calculating ${n}-gram frequency${groupBySpeaker ? ' grouped by speaker' : ''}.`);

  if (!Array.isArray(transcripts)) {
    const errorMsg = 'getWordFrequency: Invalid input - transcripts should be an array.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (n < 1) {
    const errorMsg = `getWordFrequency: Invalid n value (${n}). It must be a positive integer.`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  const freqMap = {}; // Initialize frequency map

  transcripts.forEach((seg, index) => {
    if (!seg || typeof seg.text !== 'string') {
      logger.warn(`getWordFrequency: Invalid transcript segment at index ${index}. Skipping.`);
      return;
    }

    const tokens = cleanAndTokenize(seg.text);
    const finalTokens = n > 1 ? getNgrams(tokens, n) : tokens;

    finalTokens.forEach(token => {
      // Skip if token is a stopword (for single words only)
      // For n-grams, skip if all constituent words are stopwords
      if (n === 1 && stopwords.has(token)) return;
      if (n > 1) {
        const words = token.split(' ');
        const allStopwords = words.every(word => stopwords.has(word));
        if (allStopwords) return;
      }

      if (groupBySpeaker) {
        const speaker = seg.speaker || 'Unknown';
        if (!freqMap[speaker]) {
          freqMap[speaker] = {};
        }
        freqMap[speaker][token] = (freqMap[speaker][token] || 0) + 1;
      } else {
        freqMap[token] = (freqMap[token] || 0) + 1;
      }
    });
  });

  logger.info('getWordFrequency: Word frequency calculation completed.');
  return freqMap;
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
  if (typeof freqMap !== 'object' || freqMap === null) {
    const errorMsg = 'getKeywords: Invalid input - freqMap should be a non-null object.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (typeof limit !== 'number' || limit < 1) {
    const errorMsg = `getKeywords: Invalid limit value (${limit}). It must be a positive integer.`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.info(`getKeywords: Extracting top ${limit} keywords.`);

  const entries = Object.entries(freqMap);

  if (entries.length === 0) {
    logger.warn('getKeywords: Frequency map is empty. No keywords to extract.');
    return [];
  }

  // Sort by count descending
  entries.sort((a, b) => b[1] - a[1]);

  // Return the top 'limit' keywords
  const topKeywords = entries.slice(0, limit).map(([keyword, count]) => ({
    keyword,
    count,
  }));

  logger.info(`getKeywords: Successfully extracted top ${limit} keywords.`);
  return topKeywords;
}

module.exports = {
  cleanAndTokenize,
  getNgrams,
  getWordFrequency,
  getKeywords,
  defaultStopwords, // Exported for potential external use
};
 