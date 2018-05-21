'use strict';

const errors = require('app/errors');

/**
 * Authentication Service.
 *
 * This class coordinates the logic for JWT generation
 */
class AuthenticationService {

    /**
     * Class constructor
     *
     * @constructor
     */
    constructor(config, logger, metrics, jwt, model) {
        this.config = config;
        this.logger = logger;
        this.metrics = metrics;
        this.jwt = jwt;
        this.model = model;
    }

    /**
     * Authenticates a user
     */
    async oauthLogin(userData) {

        let userId = await this.model.getUserId(userData.email);
        
        if (!userId) {
            userId = await this.model.registerUser(userData);
        }
        // Create Jwt Token
        let jwtToken = this.jwt.createToken(userId);

        return Promise.resolve(jwtToken);
    }

}

module.exports = AuthenticationService;
