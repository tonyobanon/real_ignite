'use strict';
let httpStatus = require('http-status');
const errors = require('app/errors');
const serviceLocator = require('app/lib/service_locator');

const jwt = serviceLocator.get('jwt');

/**
 * Middleware to verify that a JWT token is still valid ("logged in" / active)
 * 
 * @param  {Request}  req  The http request object
 * @param  {Response} res  The http response object
 * @param  {Function} next Callback to indicate that the next middleware can be initiated
 */
module.exports = (req, res, next) => {

    if (!req.url.startsWith('/api')) {
        return next();
    }

    if (req.params.user_id) {
        // Do not allow the user to pass in a user_id in the request
        res.send(httpStatus.FORBIDDEN, new errors.InvalidCredentialsError(`Authentication must only be via jwtTokens; user - ${req.params.user_id}`));
        return;
    }

    function fromHeaderOrQuerystringOrCookie(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        } else if (req.cookies && req.cookies.user_auth) {
            return req.cookies.user_auth;   
        }
        return null;
    }

    let jwtToken = fromHeaderOrQuerystringOrCookie(req);

    if (jwtToken == null) {
        res.send(httpStatus.UNAUTHORIZED, errors.InvalidJwt());
        return;
    }

    return jwt.verifyToken(jwtToken)
        .then((tokenData) => {
            req.params.user_id = tokenData.jti;
            req.username = tokenData.jti;
            return next();
        })
        .catch(err => {
            res.send(httpStatus.UNAUTHORIZED, new errors.InvalidCredentialsError(err));
        });
};
