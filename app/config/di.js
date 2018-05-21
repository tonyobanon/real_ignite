'use strict';
const serviceLocator = require('app/lib/service_locator');
const Jwt = require('app/lib/jwt');

const MessagesModel = require('app/models/messages');
const UsersModel = require('app/models/users');

const AuthenticationService = require('app/services/authentication');

const GoogleOAuthController = require('app/controllers/google_oauth_controller');
const UserController = require('app/controllers/user_controller');
const EmailController = require('app/controllers/email_controller');

serviceLocator.register('config', () => {
    return require('app/config/config');
});

//Libraries

serviceLocator.register('logger', () => {
    let config = serviceLocator.get('config');
    return require('app/lib/logging').create(config);
});

serviceLocator.register('metrics', (serviceLocator) => {
    let config = serviceLocator.get('config');
    let logger = serviceLocator.get('logger');
    return require('app/lib/metrics').create(logger, config.statsd);
});

serviceLocator.register('jwt', () => {

    let config = serviceLocator.get('config');
    let logger = serviceLocator.get('logger');
    let metrics = serviceLocator.get('metrics');

    return new Jwt(config, logger, metrics, require('jsonwebtoken'));
});

serviceLocator.register('redis', () => {
    return require('app/config/redis');
});


//Models

serviceLocator.register('knex', () => {
    return require('knex')(require('app/config/database'));
});

serviceLocator.register('messagesModel', (serviceLocator) => {

    let config = serviceLocator.get('config');
    let logger = serviceLocator.get('logger');
    let metrics = serviceLocator.get('metrics');
    let knex = serviceLocator.get('knex');

    return new MessagesModel(config, logger, metrics, knex);
});

serviceLocator.register('usersModel', (serviceLocator) => {

    let config = serviceLocator.get('config');
    let logger = serviceLocator.get('logger');
    let metrics = serviceLocator.get('metrics');
    let knex = serviceLocator.get('knex');

    return new UsersModel(config, logger, metrics, knex);
});

//Services

serviceLocator.register('emailService', (serviceLocator) => {

    let config = serviceLocator.get('config');
    let logger = serviceLocator.get('logger');
    let metrics = serviceLocator.get('metrics');
    let messagesModel = serviceLocator.get('messagesModel');

    return require('app/services/email_service')
        .getInstance(config.email_service, logger, metrics, messagesModel);
});

serviceLocator.register('authenticationService', (serviceLocator) => {

    let config = serviceLocator.get('config');
    let logger = serviceLocator.get('logger');
    let metrics = serviceLocator.get('metrics');
    let jwt = serviceLocator.get('jwt');
    let usersModel = serviceLocator.get('usersModel');

    return new AuthenticationService(config, logger, metrics, jwt, usersModel);
});


//Controllers

serviceLocator.register('googleOAuthController', (serviceLocator) => {

    let config = serviceLocator.get('config');
    let logger = serviceLocator.get('logger');
    let metrics = serviceLocator.get('metrics');
    let authenticationService = serviceLocator.get('authenticationService');

    return new GoogleOAuthController(config, logger, metrics, authenticationService);
});

serviceLocator.register('userController', (serviceLocator) => {

    let config = serviceLocator.get('config');
    let logger = serviceLocator.get('logger');
    let metrics = serviceLocator.get('metrics');
    let usersModel = serviceLocator.get('usersModel');

    return new UserController(config, logger, metrics, usersModel);
});

serviceLocator.register('emailController', (serviceLocator) => {

    let config = serviceLocator.get('config');
    let logger = serviceLocator.get('logger');
    let metrics = serviceLocator.get('metrics');
    let emailService = serviceLocator.get('emailService');

    let usersModel = serviceLocator.get('usersModel');
    let messagesModel = serviceLocator.get('messagesModel');

    let redis = serviceLocator.get('redis');
    return new EmailController(config, logger, metrics, emailService, messagesModel, usersModel, redis);
});

module.exports = serviceLocator;
