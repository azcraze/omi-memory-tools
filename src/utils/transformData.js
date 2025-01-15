// src/utils/transformData.js

const _ = require('lodash');

/**
 * Recursively transforms object keys from camelCase to snake_case.
 * @param {Object|Array} data - The data to transform.
 * @returns {Object|Array} - The transformed data.
 */
function camelToSnake(data) {
    if (Array.isArray(data)) {
        return data.map(item => camelToSnake(item));
    } else if (data !== null && typeof data === 'object') {
        return Object.keys(data).reduce((acc, key) => {
            const newKey = _.snakeCase(key);
            acc[newKey] = camelToSnake(data[key]);
            return acc;
        }, {});
    }
    return data;
}

module.exports = { camelToSnake };
