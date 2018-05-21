'use strict';
const errors = require('app/errors');
const httpStatusCode = require('http-status');
const restify = require('restify');

module.exports.register = function setup(server) {

    const middlewares = require('app/middlewares/index');

    server.on('after', restify.plugins.metrics({ server: server }, middlewares.metrics));

    server.on('NotFound', function (req, res) {
        server.metrics.increment('request.not_found');
        res.send(httpStatusCode.NOT_FOUND, new errors.MethodNotImplemented());
    });

    server.on('VersionNotAllowed', function (req, res) {
        server.metrics.increment('request.version_not_allowed');
        res.send(httpStatusCode.NOT_FOUND, new errors.VersionNotAllowedError());
    });

    server.on('InvalidVersion', function (req, res) {
        server.metrics.increment('request.invalid_version');
        res.send(httpStatusCode.NOT_FOUND, new errors.VersionNotAllowedError());
    });

    server.on('uncaughtException', function (req, res, route, err) {
        server.metrics.increment('request.uncaught_exception');
        res.send(httpStatusCode.INTERNAL_SERVER_ERROR, new errors.InternalServerError(err.toString()));
    });

    server.on('MethodNotAllowed', function (req, res) {
        server.metrics.increment('request.method_not_allowed');
        res.send(httpStatusCode.BAD_REQUEST, new errors.MethodNotAllowedError());
    });


    process.on('unhandledRejection', up => {

        if (process.env.NODE_ENV == 'development') {
            throw up;
        } else {

            // Submit metric
            var metric_namespace = 'server_metrics';
            var tags = [up.message ? up.message : ''];
            server.metrics.increment(`${metric_namespace}.fatal_error_count`, 1, tags);

            // Notify developers of error

            let body = `Real Ignite Error report bot detected an error on ${new Date().toUTCString()}
                    <br> ${up}`;

            try {
                (async function sendMail() {
                    await (serviceLocator.get('emailService')
                        .setMessageId(utils.generateShortId())
                        .setSubject('Real Ignite Application Error')
                        .setBody(body)
                        .setSenderName('Real Ignite Error Bot')
                        .setToAddress(config.email_service.sender_address)
                        .sendMail());
                })();
            } catch (e) { }
        }
    });

};
