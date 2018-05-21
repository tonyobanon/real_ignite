const moment = require('moment');

class UsersModel {

    /**
     * Class constructor
     *
     * @constructor
     */
    constructor(config, logger, metrics, knex) {
        this.config = config;
        this.logger = logger;
        this.metrics = metrics;
        this.knex = knex;
    }

    /**
     * Registers a new user
     * @param {Object} userData
     * @returns {Promise<Number>} userId
     */
    registerUser(userData) {
        return this.knex('users')
            .returning('id')
            .insert({
                email: userData.email, // User's Email
                first_name: userData.given_name, // User's First Name
                last_name: userData.family_name, // User's Last Name
                profile_image: userData.picture, //The url that points to the user's profile picture
                auth_issuer: userData.iss, //OAuth2 Provider for this user account
                locale: userData.locale // User's Locale, Important for Localization
            }).then(data => {
                return Promise.resolve(data[0]);
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
     * Returns the user id that corresponds to the specified email, or null
     * @param {string} email Email
     * @returns {Promise<Number>}
     */
    getUserId(email) {
        return this.knex('users')
            .where({ email: email })
            .select('id')
            .then(data => {
                if (data.length) {
                    return Promise.resolve(data[0].id);
                } else {
                    return Promise.resolve(null);
                }
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
     * Returns the profile that corresponds to the specified userId
     * @param {Number} id User Id
     * @returns {Promise<Object>}
     */
    getUserProfile(id) {
        return this.knex('users')
            .where({ id: id })
            .select('email', 'first_name', 'last_name', 'profile_image', 'locale', 'active_at')
            .then(data => {
                if (data.length) {
                    return Promise.resolve(data[0]);
                } else {
                    return Promise.resolve(null);
                }
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
     * Returns the name for the specified user
     * @param {Number} id User Id
     * @returns {Promise<Object>}
     */
    getUserName(id) {
        return this.knex('users')
            .where({ id: id })
            .select('first_name', 'last_name')
            .then(data => {
                if (data.length) {
                    let names = data[0];
                    return Promise.resolve(names.first_name + ' ' + names.last_name);
                } else {
                    return Promise.resolve(null);
                }
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }
}

module.exports = UsersModel;
