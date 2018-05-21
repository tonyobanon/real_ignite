
var database = require('app/config/database');

/**
 * Database settings.
 *
 * Setting the db settings in knexfile allows us to make use of the migrations.
 *
 * @type {Object} Database settings
 */

module.exports = {
    production: database,
    staging: database,
    development: database
};
