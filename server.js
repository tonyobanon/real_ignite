'use strict';

const os = require('os');
const utils = require('app/utils');
const restify = require('restify');
const handlers = require('app/routes/handlers');
const config = require('app/config/config');
const routes = require('app/routes/routes');
const formatter = require('app/lib/jsend_formatter');

var CookieParser = require('restify-cookies');

const serviceLocator = require('app/config/di');

const joi = require('joi');
const EventBus = require('eventbusjs');


/** catch fatal errors on startup**/
process.on('uncaughtException', function (er) {
    server.metrics.increment('error.uncaught_exception');
    logger.error(er.stack);
    logger.error(er);
    process.exit(1);
});

/**Initialize web service.**/
let server = restify.createServer({
    name: 'Real Ignite',
    versions: ['1.0.0'],
    formatters: {
        'application/json': formatter
    }
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());

server.use(restify.plugins.bodyParser({
    // this should supposedly limit maximum upload size to 10 KiB
    maxBodySize: config.web.max_upload_size,
    mapParms: true,
    mapFiles: true,
    keepExtensions: true,
    uploadDir: os.tmpdir()
}));

server.use(CookieParser.parse);

server.use(restify.plugins.throttle({
    burst: config.web.throttle_burst,
    rate: config.web.throttle_rate,
    ip: true,   // throttle per IP
}));

server.use(restify.plugins.requestLogger());

let logger = serviceLocator.get('logger');

server.metrics = serviceLocator.get('metrics');

/** RouteStats **/
let RouteStats = require('app/lib/routestats');
let routeStats = new RouteStats(server.metrics, utils.resolveRouteName);

/** RouteStats middleware. **/
server.use(function (req, res, next) {
    routeStats.record(req, res);
    next();
});

let validationMiddleware = require('./app/lib/validation');
server.use(validationMiddleware.paramValidation(joi, logger, {})); // verification for request parameters

handlers.register(server);
routes.register(server, serviceLocator);

server.get('/*', restify.plugins.serveStatic({
    directory: './public',
    default: 'index.html'
}));

server.listen(config.web.port, '0.0.0.0', function () {

    server.metrics.increment('server.start');
    logger.info('%s listening at %s', server.name, server.url);

    EventBus.dispatch('server_start_event', server.name, server.url);
});

module.exports = server;
