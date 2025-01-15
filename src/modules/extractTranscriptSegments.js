// src/modules/extractTranscriptSegments.js

const logger = require('../utils/logger.js');

/**
 * extractTranscriptSegments
 * Iterates through each memory and returns an array of relevant transcript info.
 *
 * @param {Array} memories - Array of conversation memory objects.
 * @returns {Array} Array of objects { memoryId, transcript: [ { text, speaker, speaker_id, is_user, start, end } ] }
 * @throws {Error} If memories is not a valid array or memory objects lack expected structure.
 */
function extractTranscriptSegments(memories = []) {
  logger.info('extractTranscriptSegments: Starting transcript segments extraction.');

  // Input Validation
  if (!Array.isArray(memories)) {
    const errorMsg = 'extractTranscriptSegments: Invalid input - memories should be an array.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (memories.length === 0) {
    logger.warn('extractTranscriptSegments: The memories array is empty. No transcript segments to extract.');
    return [];
  }

  const result = memories.map((mem, memIndex) => {
    if (!mem || typeof mem !== 'object') {
      logger.warn(`extractTranscriptSegments: Memory at index ${memIndex} is invalid or not an object. Skipping.`);
      return {
        memoryId: mem?.id || `unknown-${memIndex}`,
        transcript: [],
      };
    }

    const segments = mem.transcript_segments || [];

    if (!Array.isArray(segments)) {
      logger.warn(`extractTranscriptSegments: transcript_segments in memory ${mem.id || memIndex} is not an array. Skipping segments.`);
      return {
        memoryId: mem.id || `unknown-${memIndex}`,
        transcript: [],
      };
    }

    // Transform each transcript segment
    const transformedSegments = segments.map((seg, segIndex) => {
      if (!seg || typeof seg !== 'object') {
        logger.warn(`extractTranscriptSegments: Transcript segment at index ${segIndex} in memory ${mem.id || memIndex} is invalid or not an object. Skipping.`);
        return null; // Exclude invalid segments
      }

      const { text, speaker, speaker_id, is_user, start, end } = seg;

      // Basic validation for required fields
      if (typeof text !== 'string') {
        logger.warn(`extractTranscriptSegments: Transcript segment at index ${segIndex} in memory ${mem.id || memIndex} has invalid text. Expected string.`);
      }

      if (typeof speaker !== 'string') {
        logger.warn(`extractTranscriptSegments: Transcript segment at index ${segIndex} in memory ${mem.id || memIndex} has invalid speaker. Expected string.`);
      }

      // You can add more validation as needed

      return {
        text: text || '',
        speaker: speaker || 'Unknown',
        speaker_id: speaker_id || null,
        is_user: typeof is_user === 'boolean' ? is_user : false,
        start: typeof start === 'number' ? start : null,
        end: typeof end === 'number' ? end : null,
      };
    }).filter(seg => seg !== null); // Remove null entries

    return {
      memoryId: mem.id || `unknown-${memIndex}`,
      transcript: transformedSegments,
    };
  });

  logger.info(`extractTranscriptSegments: Transcript segments extracted for ${result.length} memories.`);
  logger.debug(`extractTranscriptSegments: Transcript segments - ${JSON.stringify(result, null, 2)}`);

  return result;
}

module.exports = {
  extractTranscriptSegments,
};
