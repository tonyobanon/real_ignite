'use strict';
const moment = require('moment');
const errors = require('app/errors');

class Jwt {

    constructor(config, logger, metrics, jsonwebtoken) {

        this.config = config;
        this.logger = logger;
        this.metrics = metrics;
        this.jsonwebtoken = jsonwebtoken;
    }

    /**
     * Create a JWT based on parameters received
     * @param jti  - Unique identifier of the token.
     *
     * @return {Promise} the jwt token
     */
    createToken(jti) {

        let issuer = this.config.jwt.issuer;

        let tokenData = {
            jti: jti,
            iss: issuer,
            iat: moment().unix()
        };

        let options = {
            algorithm: this.config.jwt.algorithm,
            expiresIn: 60 * 60 * 24 * 30
        };

        let privateKey = this.config.jwt[`${issuer}_private_key`];
        
        if (!privateKey) {
            return Promise.reject(new errors.IssuerPrivateKeyNotFound());
        }

        try {
            let jwtToken = this.jsonwebtoken.sign(tokenData, privateKey, options);
            return Promise.resolve(jwtToken);
        } catch (e) {
            return Promise.reject(new errors.UnableToGenerateJwt(e));
        }
    }

    /**
     * Verifies a JWT against the current issuer public key.
     * On successful validation, the decoded payload is returned without verifying if the signature is valid.
     *
     * @param token - The JWT token to verify
     *
     * @return {Promise}
     */
    verifyToken(token) {

        let issuer = this.config.jwt.issuer;
        let publicKey = this.config.jwt[`${issuer}_public_key`];

        let options = {
            maxAge: this.config.web.session_duration
        };

        if (!publicKey) {
            return Promise.reject(errors.IssuerPublicKeyNotFound());
        }

        try {

            let tokenData = this.jsonwebtoken.verify(token, publicKey, options);

            if (tokenData.iss !== issuer) {
                return Promise.reject(errors.JwtTokenIssuerMismatch());
            }

            return Promise.resolve(tokenData);

        } catch (e) {
            return Promise.reject(errors.InvalidJwt());
        }
    }

}

module.exports = Jwt;

