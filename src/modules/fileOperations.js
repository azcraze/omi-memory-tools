const fs = require('fs-extra');
const path = require('path');
const config = require('@config');
const logger = require('@logger');

/**
 * Ensures that all required directories exist.
 * Creates them if they do not.
 */
async function ensureDirectories() {
    try {
        const dirs = Object.values(config.directories);
        await Promise.all(dirs.map(dir => fs.ensureDir(dir)));
        logger.info('All necessary directories are ensured to exist.');
    } catch (error) {
        logger.error(`Error ensuring directories: ${error.message}`);
        throw error;
    }
}

/**
 * Reads JSON data from a specified file.
 * @param {string} filePath - Absolute path to the JSON file.
 * @returns {Promise<Object>} Parsed JSON data.
 */
async function readJson(filePath = config.files.rawData) {
    try {
        const data = await fs.readJson(filePath);
        logger.info(`Successfully read JSON from ${filePath}`);
        return data;
    } catch (error) {
        logger.error(`Failed to read JSON from ${filePath}: ${error.message}`);
        throw error;
    }
}

/**
 * Writes data to a specified JSON file.
 * @param {string} filename - Name of the JSON file.
 * @param {Object|Array} data - Data to write.
 * @param {string} [outputDir=config.directories.json] - Directory to save the file.
 * @returns {Promise<void>}
 */
async function writeJson(filename, data, outputDir = config.directories.json) {
    try {
        const filePath = path.join(outputDir, filename);
        await fs.outputJson(filePath, data, {
            spaces: 2
        });
        logger.info(`Successfully wrote JSON to ${filePath}`);
    } catch (error) {
        logger.error(`Failed to write JSON to ${filePath}: ${error.message}`);
        throw error;
    }
}

/**
 * Writes data to a specified Markdown file.
 * @param {string} filename - Name of the Markdown file.
 * @param {string} data - Markdown content.
 * @param {string} [outputDir=config.directories.markdown] - Directory to save the file.
 * @returns {Promise<void>}
 */
async function writeMarkdown(filename, data, outputDir = config.directories.markdown) {
    try {
        const filePath = path.join(outputDir, filename);
        await fs.outputFile(filePath, data);
        logger.info(`Successfully wrote Markdown to ${filePath}`);
    } catch (error) {
        logger.error(`Failed to write Markdown to ${filePath}: ${error.message}`);
        throw error;
    }
}

/**
 * Writes data to a specified CSV file.
 * @param {string} filename - Name of the CSV file.
 * @param {Array<Object>} data - Array of objects to convert to CSV.
 * @param {string} [outputDir=config.directories.csv] - Directory to save the file.
 * @returns {Promise<void>}
 */
async function writeCsv(filename, data, outputDir = config.directories.csv) {
    try {
        const filePath = path.join(outputDir, filename);
        if (data.length === 0) {
            logger.warn(`No data provided to write to CSV ${filePath}`);
            return;
        }
        const headers = Object.keys(data[0]);
        const csvContent =
            headers.join(',') +
            '\n' +
            data.map(row => headers.map(field => `"${row[field] || ''}"`).join(',')).join('\n');
        await fs.outputFile(filePath, csvContent);
        logger.info(`Successfully wrote CSV to ${filePath}`);
    } catch (error) {
        logger.error(`Failed to write CSV to ${filePath}: ${error.message}`);
        throw error;
    }
}

module.exports = {
    ensureDirectories,
    readJson,
    writeJson,
    writeMarkdown,
    writeCsv,
};