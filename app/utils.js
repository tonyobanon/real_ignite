'use strict';

const fs = require('fs');

let $ = module.exports;

/**
 Returns formatted name for a given route's path
 @param route
 **/
$.resolveRouteName = function (route) {
    if (route && route.path) {
        route = (typeof route.path === 'object') ? route.path[0] : route.path;

        // splitting and joining is faster than replacing: http://jsperf.com/replace-all-vs-split-join
        route = route.split(':').join('');
        route = route.split('/').join('_');

        // tidy up the start of the route name
        if (route[0] === '_' || route[0] === '.') {
            route = route.slice(1);
        }

        // tidy up the end of the route name
        let lastChar = route.length - 1;
        if (route[lastChar] === '_' || route[lastChar] === '.') {
            route = route.slice(0, -1);
        }

    } else {
        route = 'no_route';
    }

    return route;
};

$.generateShortId = function () {
    const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const ID_LENGTH = 8;
    var rtn = '';
    for (var i = 0; i < ID_LENGTH; i++) {
        rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return rtn;
};

$.base64_encode = function (file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
};

$.base64_decode = function (base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
};
