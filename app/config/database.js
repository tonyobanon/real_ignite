'use strict';

let config = require('app/config/config');

/**
 * This knex instance is used by the application
 */

let knex = {
    client: 'mysql',
    connection: config.mysql.connection,
    migrations: {
        tableName: 'migrations'
    }
};

module.exports = knex;
