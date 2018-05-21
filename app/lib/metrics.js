/**
 * This class creates a new statsD clients, to provide metrics for our simple app.
 *
 * Module users: After export, you may use statsd interface as usual:
 * metrics.{set, increment, decrement, gauge, timing}
 */

'use strict';
const Client = require('statsd-client');

let defaultHost = 'real_ignite_graphite_statsd';
let defaultPort = 8125;

let config;
let logger;

let $ = {};

/**
 * Factory method to produce a configured metrics instance with the standard Lynx interface.
 * @param loggerInstance
 * @param configuration
 * @returns {Object}
 */
$.create = function (loggerInstance, configuration) {

    logger = loggerInstance;
    config = configuration;

    if (config.scope === undefined) {
        throw new Error('Real Ignite metrics module require that you provide it the statsd scope to log to.');
    }

    let host = config.host || defaultHost;
    let port = config.port || defaultPort;

    logger.info('metrics/statsd-client instantiating with host %s:%s', host, port);

    return new Client({
        host: host,
        port: port,
        prefix: config.scope,
        debug: config.debug === 'true'
    });
};

module.exports = $;
