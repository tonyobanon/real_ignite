'use strict';

module.exports = (req, res, next) => {

    if (process.env.NODE_ENV === 'development' || !req.url.startsWith('/api')) {
        // Add no-ache headers
        req.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        req.headers['Pragma'] = 'no-cache';
        req.headers['Expires'] = '0';
    }
    next();
};