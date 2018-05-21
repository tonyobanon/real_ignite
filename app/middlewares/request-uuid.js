'use strict';

const config = require('app/config/config');
const uuidv5 = require('uuid/v5');
var createNamespace = require('continuation-local-storage').createNamespace;
var request = createNamespace('request');

module.exports = (req, res, next) => {
    request.run(function() {
        request.set('request-id', uuidv5(config.web.site_url, uuidv5.URL));
        next();
    });
};