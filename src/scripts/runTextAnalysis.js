// src/scripts/runTextAnalysis.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { validateMemories } = require('../utils/verifyValidData.js');
const { filterNonDiscarded } = require('../modules/filterNonDiscarded.js');
const { writeJsonToCsv } = require('../utils/writeToCsv.js');
const { ValidationError, MemoryProcessingError, FileOperationError } = require('../utils/customErrors.js');
const { getWordFrequency, getKeywords, defaultStopwords } = require('../modules/textAnalysis.js');  // Import defaultStopwords

console.log('This is a debug log');
logger.info('runTextAnalysis: Starting text analysis process.');

/**
 * runTextAnalysis
 * Performs text analysis on transcripts, including word frequency and keyword extraction.
 */
async function runTextAnalysis() {
  console.log('Starting the text analysis process'); // Debugging log
  logger.info('runTextAnalysis: Starting text analysis process.', { timestamp: new Date().toISOString() });

  try {
    const conversationsPath = path.join(process.cwd(), 'src', 'data', 'filteredConversations.json');
    console.log('Path to filteredConversations.json:', conversationsPath); // Debugging log

    // Step 1: Read and parse filteredConversations.json
    let rawData;
    try {
      console.log('Attempting to read the conversations file'); // Debugging log
      rawData = await fs.readFile(conversationsPath, 'utf-8');
      console.log('Successfully read filteredConversations.json'); // Debugging log
      logger.info(`runTextAnalysis: Successfully read filteredConversations.json from ${conversationsPath}.`, { timestamp: new Date().toISOString() });
    } catch (readError) {
      const errorMsg = `runTextAnalysis: Failed to read filteredConversations.json: ${readError.message}`;
      logger.error(errorMsg, { timestamp: new Date().toISOString() });
      console.error('Error reading file:', errorMsg); // Debugging log
      throw new FileOperationError(errorMsg);
    }

    let allMemories;
    try {
      allMemories = JSON.parse(rawData);
      console.log('Successfully parsed filteredConversations.json'); // Debugging log
      logger.info('runTextAnalysis: Successfully parsed filteredConversations.json.', { timestamp: new Date().toISOString() });
    } catch (parseError) {
      const errorMsg = `runTextAnalysis: Failed to parse filteredConversations.json: ${parseError.message}`;
      logger.error(errorMsg, { timestamp: new Date().toISOString() });
      console.error('Error parsing JSON:', errorMsg); // Debugging log
      throw new ValidationError(errorMsg);
    }

    // Step 2: Validate memories
    console.log('Validating memories...'); // Debugging log
    const { validMemories, invalidMemories } = validateMemories(allMemories);
    console.log('Validation complete. Valid memories:', validMemories.length, 'Invalid memories:', invalidMemories.length); // Debugging log

    if (invalidMemories.length > 0) {
      logger.warn(`runTextAnalysis: ${invalidMemories.length} memories failed validation and will be skipped.`, { timestamp: new Date().toISOString() });

      // Write invalid memories to a separate file
      const invalidPath = path.join(process.cwd(), 'output', 'reports', 'invalidMemories.json');
      try {
        await fs.mkdir(path.dirname(invalidPath), { recursive: true });
        await fs.writeFile(invalidPath, JSON.stringify(invalidMemories, null, 2), 'utf-8');
        console.log('Invalid memories written to:', invalidPath); // Debugging log
        logger.info(`runTextAnalysis: Invalid memories written to: ${invalidPath}`, { timestamp: new Date().toISOString() });
      } catch (writeError) {
        const errorMsg = `runTextAnalysis: Failed to write invalidMemories.json: ${writeError.message}`;
        logger.error(errorMsg, { timestamp: new Date().toISOString() });
        console.error('Error writing invalid memories:', errorMsg); // Debugging log
        throw new FileOperationError(errorMsg);
      }
    }

    // Step 3: Filter non-discarded memories
    const activeMemories = filterNonDiscarded(validMemories);
    console.log('Active memories to analyze:', activeMemories.length); // Debugging log
    logger.info(`runTextAnalysis: ${activeMemories.length} active memories to analyze.`, { timestamp: new Date().toISOString() });

    if (activeMemories.length === 0) {
      logger.warn('runTextAnalysis: No active memories found. Exiting text analysis.', { timestamp: new Date().toISOString() });
      console.warn('No active memories found. Exiting analysis.'); // Debugging log
      return;
    }

    // Step 4: Aggregate all transcript segments
    const allTranscripts = activeMemories.flatMap((mem, memIndex) => {
      if (!Array.isArray(mem.transcript_segments)) {
        logger.warn(`runTextAnalysis: Memory at index ${memIndex} with ID ${mem.id} has no transcript_segments. Skipping.`, { timestamp: new Date().toISOString() });
        console.log(`Memory ${memIndex} skipped (no transcript segments)`); // Debugging log
        return [];
      }
      return mem.transcript_segments.map(seg => ({
        ...seg,
        memoryId: mem.id,
        title: mem.title || 'Untitled Conversation',
        overview: mem.overview || 'No overview provided.',
        timestamp: mem.timestamp || mem.date || mem.datetime || mem.created_at || 'Unknown Date',
      }));
    });

    console.log('Aggregated transcript segments:', allTranscripts.length); // Debugging log
    logger.info(`runTextAnalysis: Aggregated ${allTranscripts.length} transcript segments from active memories.`, { timestamp: new Date().toISOString() });

    if (allTranscripts.length === 0) {
      logger.warn('runTextAnalysis: No transcript segments found in active memories. Exiting text analysis.', { timestamp: new Date().toISOString() });
      console.warn('No transcript segments found. Exiting analysis.'); // Debugging log
      return;
    }

    // Step 5: Calculate word frequency (using n-grams, e.g., bigrams)
    const n = 2; // Example: 2 for bigrams, change to 3 for trigrams, etc.
    console.log('Calculating word frequency for n-grams (n = 2)'); // Debugging log
    const wordFreq = getWordFrequency(allTranscripts, { n: n, groupBySpeaker: false, stopwords: defaultStopwords });
    logger.info('runTextAnalysis: Word frequency calculation completed.', { timestamp: new Date().toISOString() });

    // Step 6: Sort word frequencies (most to least frequent) and exclude terms that appear only once
    const filteredSortedFreq = Object.entries(wordFreq)
      .filter(([_, count]) => count > 1)  // Exclude terms used only once
      .sort(([, countA], [, countB]) => countB - countA);  // Sort by count descending

    console.log('Filtered and sorted frequencies:', filteredSortedFreq.length); // Debugging log
    const topKeywords = filteredSortedFreq.slice(0, 10).map(([keyword, count]) => ({
      keyword,
      count
    }));
    logger.info('runTextAnalysis: Top 10 keywords extracted.', { timestamp: new Date().toISOString() });

    // Step 7: Format results
    const textAnalysisResults = {
      metadata: {
        analyzedAt: new Date().toLocaleString(),
        totalMemories: activeMemories.length,
        totalTranscripts: allTranscripts.length,
        wordCount: filteredSortedFreq.reduce((sum, [, count]) => sum + count, 0),
        uniqueWords: filteredSortedFreq.length,
      },
      wordFrequency: Object.fromEntries(filteredSortedFreq),  // Convert back to an object
      topKeywords,
    };

    // Step 8: Ensure output directories exist
    const outputDirJson = path.join(process.cwd(), 'output', 'reports');
    const outputDirCsv = path.join(process.cwd(), 'output', 'csv');
    try {
      await Promise.all([
        fs.mkdir(outputDirJson, { recursive: true }),
        fs.mkdir(outputDirCsv, { recursive: true }),
      ]);
      console.log('Output directories created:', outputDirJson, outputDirCsv); // Debugging log
      logger.info('runTextAnalysis: Ensured output directories for JSON and CSV.', { timestamp: new Date().toISOString() });
    } catch (mkdirError) {
      const errorMsg = `runTextAnalysis: Failed to create output directories: ${mkdirError.message}`;
      logger.error(errorMsg, { timestamp: new Date().toISOString() });
      console.error('Error creating directories:', errorMsg); // Debugging log
      throw new FileOperationError(errorMsg);
    }

    // Step 9: Write results to JSON
    const analysisJsonPath = path.join(outputDirJson, 'textAnalysis.json');
    try {
      await fs.writeFile(analysisJsonPath, JSON.stringify(textAnalysisResults, null, 2), 'utf-8');
      console.log('Results written to JSON:', analysisJsonPath); // Debugging log
      logger.info(`runTextAnalysis: Text analysis results written to JSON: ${analysisJsonPath}`, { timestamp: new Date().toISOString() });
    } catch (writeError) {
      const errorMsg = `runTextAnalysis: Failed to write textAnalysis.json: ${writeError.message}`;
      logger.error(errorMsg, { timestamp: new Date().toISOString() });
      console.error('Error writing to JSON:', errorMsg); // Debugging log
      throw new FileOperationError(errorMsg);
    }

    // Step 10: Write word frequency to CSV
    const wordFreqFields = ['word', 'count'];
    const wordFreqData = filteredSortedFreq.map(([word, count]) => ({ word, count }));
    const wordFreqCsvPath = path.join(outputDirCsv, 'wordFrequency.csv');
    try {
      await writeJsonToCsv(wordFreqData, wordFreqFields, wordFreqCsvPath);
      console.log('Word frequency data written to CSV:', wordFreqCsvPath); // Debugging log
      logger.info(`runTextAnalysis: Word frequency data written to CSV: ${wordFreqCsvPath}`, { timestamp: new Date().toISOString() });
    } catch (csvError) {
      const errorMsg = `runTextAnalysis: Failed to write wordFrequency.csv: ${csvError.message}`;
      logger.error(errorMsg, { timestamp: new Date().toISOString() });
      console.error('Error writing to CSV:', errorMsg); // Debugging log
      throw new ValidationError(errorMsg);
    }

    // Step 11: Write top keywords to CSV
    const topKeywordsFields = ['keyword', 'count'];
    const topKeywordsCsvPath = path.join(outputDirCsv, 'topKeywords.csv');
    try {
      await writeJsonToCsv(topKeywords, topKeywordsFields, topKeywordsCsvPath);
      console.log('Top keywords data written to CSV:', topKeywordsCsvPath); // Debugging log
      logger.info(`runTextAnalysis: Top keywords data written to CSV: ${topKeywordsCsvPath}`, { timestamp: new Date().toISOString() });
    } catch (csvError) {
      const errorMsg = `runTextAnalysis: Failed to write topKeywords.csv: ${csvError.message}`;
      logger.error(errorMsg, { timestamp: new Date().toISOString() });
      console.error('Error writing top keywords to CSV:', errorMsg); // Debugging log
      throw new ValidationError(errorMsg);
    }

    logger.info('runTextAnalysis: Text analysis process completed successfully.', { timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in text analysis process:', error.message); // Debugging log
    logger.error(`runTextAnalysis: Process failed - ${error.message}`, { timestamp: new Date().toISOString() });
    process.exit(1);
  }
}

module.exports = {
  runTextAnalysis,
};
