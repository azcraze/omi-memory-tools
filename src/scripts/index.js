// src/scripts/index.js
require('module-alias/register');

const inquirer = require('inquirer');
const chalk = require('chalk');
const logger = require('../utils/logger.js');
const {
  executeTask
} = require('../utils/executeTask.js'); // Import the executeTask function

// Import the script functions (now async or Promise-based)
const {
  runValidationCheck
} = require('./runValidationCheck.js');
const {
  runFiltering
} = require('./runFiltering.js');
const {
  runWriteCategories
} = require('./runWriteCategories.js');
const {
  runExtractTranscripts
} = require('./runExtractTranscripts.js');
const {
  runTextAnalysis
} = require('./runTextAnalysis.js');
const {
  runExtractPlugins
} = require('./runExtractPlugins.js');
const {
  runWriteMarkdown
} = require('./runWriteMarkdown.js');
const {
  runWriteCsv
} = require('./runWriteCsv.js');

/**
 * runAllTasks
 * Executes all tasks in a specific sequence, awaiting each one before moving to the next.
 */
async function runAllTasks() {
  logger.info(chalk.yellow('runAllTasks: Initiating the execution of all tasks in sequence.'));
  console.log(chalk.yellow('Initiating all tasks...'));

  try {
    await executeTask(runValidationCheck, '1) Validating conversations');
    await executeTask(runFiltering, '2) Filtering memories');
    await executeTask(runWriteCategories, '3) Extracting categories');
    await executeTask(runExtractTranscripts, '4) Extracting transcripts');
    await executeTask(runTextAnalysis, '5) Performing text analysis');
    await executeTask(runExtractPlugins, '6) Extracting plugin responses');
    await executeTask(runWriteMarkdown, '7) Writing Markdown outputs');
    await executeTask(runWriteCsv, '8) Writing CSV outputs');
    logger.info(chalk.magenta('runAllTasks: All tasks completed successfully!'));
    console.log(chalk.magenta('All tasks completed successfully!'));
  } catch (error) {
    logger.error(`runAllTasks: Execution halted due to an error - ${error.message}`);
    console.error(chalk.red('One or more tasks failed. Please check the logs for details.'));
  }
}

/**
 * mainMenu
 * Displays a menu of available tasks using Inquirer,
 * then runs the chosen function with appropriate logging.
 */
async function mainMenu() {
  logger.info(chalk.bold.blue('mainMenu: Displaying the main menu.'));
  console.log(chalk.bold.blue('Welcome to the Memories Processing Toolbox CLI!'));

  try {
    const answers = await inquirer.prompt([{
      type: 'list',
      name: 'task',
      message: chalk.yellow('Please select a task to run:'),
      choices: [{
          name: 'Validate Conversations (Schema Check)',
          value: 'validate'
        },
        {
          name: 'Filter Discarded/Deleted Memories',
          value: 'filter'
        },
        {
          name: 'Extract Categories',
          value: 'categories'
        },
        {
          name: 'Extract Transcripts',
          value: 'transcripts'
        },
        {
          name: 'Perform Text Analysis (Word Frequency, Keywords)',
          value: 'textAnalysis'
        },
        {
          name: 'Extract Plugin Responses',
          value: 'plugins'
        },
        {
          name: 'Write Markdown Outputs',
          value: 'markdown'
        },
        {
          name: 'Write CSV Outputs',
          value: 'csv'
        },
        new inquirer.Separator(),
        {
          name: 'Run ALL tasks in sequence',
          value: 'all'
        },
        {
          name: 'Exit',
          value: 'exit'
        },
      ],
    }, ]);

    switch (answers.task) {
      case 'validate':
        await executeTask(runValidationCheck, 'Validating conversations');
        break;
      case 'filter':
        await executeTask(runFiltering, 'Filtering memories');
        break;
      case 'categories':
        await executeTask(runWriteCategories, 'Extracting categories');
        break;
      case 'transcripts':
        await executeTask(runExtractTranscripts, 'Extracting transcripts');
        break;
      case 'textAnalysis':
        await executeTask(runTextAnalysis, 'Performing text analysis');
        break;
      case 'plugins':
        await executeTask(runExtractPlugins, 'Extracting plugin responses');
        break;
      case 'markdown':
        await executeTask(runWriteMarkdown, 'Writing Markdown outputs');
        break;
      case 'csv':
        await executeTask(runWriteCsv, 'Writing CSV outputs');
        break;
      case 'all':
        await runAllTasks(); // Executes all tasks in sequence
        break;
      case 'exit':
        logger.info(chalk.cyan('mainMenu: User chose to exit the CLI.'));
        console.log(chalk.cyan('Goodbye!'));
        return;
      default:
        logger.warn('mainMenu: Unknown option selected. Exiting.');
        console.log(chalk.red('Unknown option selected. Exiting.'));
        return;
    }

    // Re-display the menu after task completion for continuous interaction
    await mainMenu();
  } catch (error) {
    logger.error(`mainMenu: Encountered an unexpected error - ${error.message}`);
    console.error(chalk.red('An unexpected error occurred. Please check the logs for details.'));
  }
}

module.exports = {
  mainMenu,
};

// Execute the mainMenu if the script is run directly
if (require.main === module) {
  (async () => {
    try {
      logger.info(chalk.blue('index.js: Starting the CLI application.'));
      await mainMenu();
    } catch (error) {
      logger.error(`index.js: CLI terminated unexpectedly - ${error.message}`);
      console.error(chalk.red('CLI terminated unexpectedly. Please check the logs for details.'));
      process.exit(1);
    }
  })();
}