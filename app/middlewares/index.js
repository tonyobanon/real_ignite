'use strict';
const middlewares = {};

// Our middlewares

middlewares.request_uuid = require('app/middlewares/request-uuid');
middlewares.auth = require('app/middlewares/auth');
middlewares.cache_control = require('app/middlewares/cache-control');
middlewares.metrics = require('app/middlewares/metrics');

module.exports = middlewares;
