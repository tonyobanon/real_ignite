'use strict';

module.exports.register = function (server, serviceLocator) {

    const middlewares = require('app/middlewares/index');

    server.use(middlewares.request_uuid);
    server.use(middlewares.cache_control);
    server.use(middlewares.auth);

    // OAuth Controllers (More OAuth providers can be easily added here)

    let googleOAuthController = serviceLocator.get('googleOAuthController');

    server.get({
        path: '/auth/google/redirect',
        name: 'Google Oauth Login Redirect',
        version: '1.0.0'
    }, (req, res, next) => googleOAuthController.redirect(req, res, next));

    server.get({
        path: '/auth/google/callback',
        name: 'Google Oauth Login Callback',
        version: '1.0.0'
    }, (req, res, next) => googleOAuthController.callback(req, res, next));



    // APIs

    let userController = serviceLocator.get('userController');

    server.get({
        path: '/api/users/get-profile',
        name: 'Get User Profile',
        version: '1.0.0'
    }, (req, res, next) => userController.getUserProfile(req, res, next));



    let emailController = serviceLocator.get('emailController');

    server.put({
        path: '/api/email/create-draft',
        name: 'Create Draft',
        version: '1.0.0'
    }, (req, res, next) => emailController.createDraft(req, res, next));

    server.post({
        path: '/api/email/update-draft',
        name: 'Update Draft',
        version: '1.0.0'
    }, (req, res, next) => emailController.updateDraft(req, res, next));


    server.get({
        path: '/api/email/get-draft',
        name: 'List Drafts',
        version: '1.0.0'
    }, (req, res, next) => emailController.getDraft(req, res, next));

    server.get({
        path: '/api/email/list-messages',
        name: 'List Messages',
        version: '1.0.0'
    }, (req, res, next) => emailController.listMessages(req, res, next));

    server.post({
        path: '/api/email/add-attachment',
        name: 'Add Draft Attachment',
        version: '1.0.0'
    }, (req, res, next) => emailController.addAttachment(req, res, next));

    server.post({
        path: '/api/email/remove-attachment',
        name: 'Remove Draft Attachment',
        version: '1.0.0'
    }, (req, res, next) => emailController.removeAttachment(req, res, next));

    server.post({
        path: '/api/email/send-message',
        name: 'Send Email Message',
        version: '1.0.0'
    }, (req, res, next) => emailController.sendMail(req, res, next));

    server.get({
        path: '/api/email/list-message-errors',
        name: 'List Provider Errors',
        version: '1.0.0'
    }, (req, res, next) => emailController.listMessageErrors(req, res, next));


    server.get({
        path: '/api/user-messages-count',
        name: 'Get Messages Count',
        version: '1.0.0'
    }, (req, res, next) => emailController.messsagesCount(req, res, next));

    server.get({
        path: '/api/get-user-activity-trend',
        name: 'Get User Activity Trend',
        version: '1.0.0'
    }, (req, res, next) => emailController.getUserActivityTrend(req, res, next));


};
