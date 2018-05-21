'use strict';

let errors = require('app/errors');
let httpStatus = require('http-status');

class UserController {

    /**
     * @param config Config Object
     * @param {winston.Logging} logging Instance of logging
     * @param metrics Instance of metrics
     * @param model User Model Instance
     */
    constructor(config, logging, metrics, model) {

        this.config = config;
        this.logging = logging;
        this.metrics = metrics;

        this.model = model;
    }

    /**
     * This retrieves the retrieves the user's profile
     * .
     * @param  {Request}  req  The http request object
     * @param  {Response} res  The http response object
     * @param  {Function} next Callback to indicate that the next middleware can be initiated
     */
    async getUserProfile(req, res, next) {
        let userId = req.params.user_id;
        let profile = await this.model.getUserProfile(userId);
        res.send(httpStatus.OK, profile);
        this.logging.debug(`Fetching the user profile for user: ${userId}`);
        this.metrics.increment('requests.users.getProfile');
        next();
    }
}

module.exports = UserController;
