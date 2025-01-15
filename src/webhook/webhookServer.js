// src/webhook/webhookServer.js

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
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(401).send('Unauthorized');
    }
    logger.error(`Error parsing request body: ${err.message}`);
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
        logger.error(`Failed to read conversations.json: ${fileError.message}`);
        throw new FileOperationError('Failed to read conversations.json');
      }
    }

    // Add the new memory
    conversations.push(memory);

    // Write back to conversations.json
    try {
      await fs.writeFile(conversationsPath, JSON.stringify(conversations, null, 2), 'utf-8');
      logger.info(`New memory added with ID: ${memory.id}`);
    } catch (writeError) {
      logger.error(`Failed to write to conversations.json: ${writeError.message}`);
      throw new FileOperationError('Failed to write new memory');
    }
  }, {
    retries: 3,
    minTimeout: 1000,
    onRetry: (error, attempt) => {
      logger.warn(`Retrying due to error: ${error.message}. Attempt ${attempt}`);
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
    logger.error(`Processing tasks failed: ${taskError.message}`);
    throw new MemoryProcessingError('Processing tasks failed');
  }
}

/**
 * Function to handle graceful shutdown
 * @param {string} signal - The signal received
 */
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

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
  logger.info(`Webhook server is listening on port ${PORT}`);
});
