// src/modules/validation.js


const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs-extra');
const config = require('@config');
const logger = require('@logger');

// Initialize AJV
const ajv = new Ajv({
    allErrors: true,
    strict: false
});
addFormats(ajv);

let schema;

/**
 * Loads the JSON schema from the schema file.
 * @returns {Promise<Object>} JSON schema object.
 */
async function loadSchema() {
    try {
        const schemaPath = config.files.schema;
        schema = await fs.readJson(schemaPath);
        ajv.addSchema(schema, 'memorySchema');
        logger.info(`Successfully loaded JSON schema from ${schemaPath}`);
    } catch (error) {
        logger.error(`Failed to load JSON schema: ${error.message}`);
        throw error;
    }
}



/**
 * Validates data against the loaded schema.
 * @param {Object|Array} data - Data to validate.
 * @returns {Object} Validation result with isValid and errors.
 */
function validateData(data) {
    if (!schema) {
        throw new Error('JSON schema not loaded. Call loadSchema() first.');
    }

    const validate = ajv.getSchema('memorySchema');
    const isValid = validate(data);
    if (!isValid) {
        logger.error('Validation errors:', validate.errors);
        return {
            isValid: false,
            errors: validate.errors
        };
    }
    logger.info('Data validation successful.');
    return {
        isValid: true,
        errors: null
    };
}

module.exports = {
    loadSchema,
    validateData,
};