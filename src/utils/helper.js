/**
* Helper module providing utility functions
* @module helper
*/

/**
* Creates a greeting message
* @param {string} name - Name to greet
* @returns {string} Greeting message
*/
const createGreeting = (name = 'user') => {
return `Hello ${name}, welcome to the application!`;
};

module.exports = {
createGreeting
};
