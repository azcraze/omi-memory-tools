// src/scripts/runExtractTranscripts.js

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');
const { extractTranscriptSegments } = require('../modules/extractTranscriptSegments.js');
const { formatTranscriptMarkdown } = require('../utils/formatMarkdown.js');
const { writeJsonToCsv } = require('../utils/writeToCsv.js');
const { ValidationError, MemoryProcessingError, FileOperationError } = require('../utils/customErrors.js');

/**
 * runExtractTranscripts
 * Extracts transcript segments from filtered memories and writes them to Markdown, JSON, and CSV files.
 */
async function runExtractTranscripts() {
  const filteredPath = path.join(__dirname, '..', 'data', 'filteredConversations.json');
  const outputDirMd = path.join(__dirname, '..', 'output', 'markdown');
  const outputDirJson = path.join(__dirname, '..', 'output', 'reports');
  const outputDirCsv = path.join(__dirname, '..', 'output', 'csv');
  const transcriptsMdPath = path.join(outputDirMd, 'transcripts.md');
  const transcriptsJsonPath = path.join(outputDirJson, 'transcripts.json');
  const transcriptsCsvPath = path.join(outputDirCsv, 'transcripts.csv');

  logger.info('runExtractTranscripts: Starting transcript extraction process.');
  console.log('runExtractTranscripts: Starting transcript extraction process.');

  try {
    // Step 1: Ensure output directories exist
    try {
      await Promise.all([
        fs.mkdir(outputDirMd, { recursive: true }),
        fs.mkdir(outputDirJson, { recursive: true }),
        fs.mkdir(outputDirCsv, { recursive: true })
      ]);
      logger.info(`runExtractTranscripts: Ensured output directories at ${outputDirMd}, ${outputDirJson}, and ${outputDirCsv}.`);
    } catch (mkdirError) {
      const errorMsg = `runExtractTranscripts: Failed to create output directories: ${mkdirError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 2: Read filteredConversations.json
    let rawData;
    try {
      rawData = await fs.readFile(filteredPath, 'utf-8');
      logger.info(`runExtractTranscripts: Successfully read filteredConversations.json from ${filteredPath}.`);
      console.log(`runExtractTranscripts: Successfully read filteredConversations.json from ${filteredPath}.`);
    } catch (readError) {
      const errorMsg = `runExtractTranscripts: Failed to read filteredConversations.json: ${readError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 3: Parse JSON data
    let activeMemories;
    try {
      activeMemories = JSON.parse(rawData);
      logger.info('runExtractTranscripts: Successfully parsed filteredConversations.json.');
      console.log('runExtractTranscripts: Successfully parsed filteredConversations.json.');
    } catch (parseError) {
      const errorMsg = `runExtractTranscripts: Failed to parse filteredConversations.json: ${parseError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 4: Validate that activeMemories is an array
    if (!Array.isArray(activeMemories)) {
      const errorMsg = 'runExtractTranscripts: Invalid data format - filteredConversations.json should contain an array.';
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 5: Extract transcript segments
    let transcriptData;
    try {
      transcriptData = extractTranscriptSegments(activeMemories);
      logger.info(`runExtractTranscripts: Extracted transcript segments for ${transcriptData.length} memories.`);
      console.log(`runExtractTranscripts: Extracted transcript segments for ${transcriptData.length} memories.`);
    } catch (extractError) {
      const errorMsg = `runExtractTranscripts: Failed to extract transcript segments: ${extractError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new MemoryProcessingError(errorMsg);
    }

    // Step 6: Format transcripts to Markdown
    let transcriptsMarkdown;
    try {
      transcriptsMarkdown = formatTranscriptMarkdown(transcriptData);
      logger.info('runExtractTranscripts: Successfully formatted transcripts to Markdown.');
      console.log('runExtractTranscripts: Successfully formatted transcripts to Markdown.');
    } catch (formatError) {
      const errorMsg = `runExtractTranscripts: Failed to format transcripts to Markdown: ${formatError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new MemoryProcessingError(errorMsg);
    }

    // Step 7: Write transcripts to Markdown
    try {
      await fs.writeFile(transcriptsMdPath, transcriptsMarkdown, 'utf-8');
      logger.info(`runExtractTranscripts: Transcripts written to Markdown: ${transcriptsMdPath}`);
      console.log(`runExtractTranscripts: Transcripts written to Markdown: ${transcriptsMdPath}`);
    } catch (writeError) {
      const errorMsg = `runExtractTranscripts: Failed to write transcripts.md: ${writeError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 8: Write transcripts to JSON
    try {
      await fs.writeFile(transcriptsJsonPath, JSON.stringify(transcriptData, null, 2), 'utf-8');
      logger.info(`runExtractTranscripts: Transcripts written to JSON: ${transcriptsJsonPath}`);
      console.log(`runExtractTranscripts: Transcripts written to JSON: ${transcriptsJsonPath}`);
    } catch (writeError) {
      const errorMsg = `runExtractTranscripts: Failed to write transcripts.json: ${writeError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new FileOperationError(errorMsg);
    }

    // Step 9: Prepare CSV data
    let flattenedTranscripts;
    try {
      const transcriptFields = ['memoryId', 'text', 'speaker', 'speaker_id', 'is_user', 'start', 'end'];
      flattenedTranscripts = transcriptData.flatMap(mem =>
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
      logger.debug('runExtractTranscripts: Flattened transcript data for CSV conversion.');
    } catch (flattenError) {
      const errorMsg = `runExtractTranscripts: Failed to flatten transcript data: ${flattenError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    // Step 10: Write transcripts to CSV
    try {
      await writeJsonToCsv(flattenedTranscripts, ['memoryId', 'text', 'speaker', 'speaker_id', 'is_user', 'start', 'end'], transcriptsCsvPath);
      logger.info(`runExtractTranscripts: Transcripts written to CSV: ${transcriptsCsvPath}`);
      console.log(`runExtractTranscripts: Transcripts written to CSV: ${transcriptsCsvPath}`);
    } catch (csvError) {
      const errorMsg = `runExtractTranscripts: Failed to write transcripts.csv: ${csvError.message}`;
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new ValidationError(errorMsg);
    }

    logger.info('runExtractTranscripts: Transcript extraction process completed successfully.');
    console.log('runExtractTranscripts: Transcript extraction process completed successfully.');
  } catch (error) {
    logger.error(`runExtractTranscripts: Process failed - ${error.message}`);
    console.error(`runExtractTranscripts: Process failed - ${error.message}`);
    process.exit(1);
  }
}

// Execute the function if the script is run directly
if (require.main === module) {
  runExtractTranscripts()
    .then(() => {
      const completionMsg = 'runExtractTranscripts: Completed successfully.';
      logger.info(completionMsg);
      console.log(completionMsg);
    })
    .catch((err) => {
      const failureMsg = 'runExtractTranscripts: Encountered a failure.';
      logger.error(failureMsg);
      console.error(failureMsg);
      process.exit(1);
    });
}

module.exports = {
  runExtractTranscripts,
};
