
const errors = require('app/errors');

class MessagesModel {

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
     * This creates a new draft for the specified user
     * @param {Number} userId User Id
     * @returns {Promise<Object>}
     */
    createDraft(userId) {
        return this.knex('messages')
            .returning(['id', 'created_at', 'updated_at', 'cc_addresses', 'bcc_addresses', 'is_sent'])
            .insert({
                user_id: userId,
                body_preview: '',
                provider_response: '',
                errors: '[]',
                cc_addresses: '[]',
                bcc_addresses: '[]'
            }).then(data => {
                //MySQL returns [id], PostgreSQL returns [id, ...]
                var now = new Date().toISOString();
                return Promise.resolve({
                    id: data[0],
                    created_at: now,
                    updated_at: now,
                    cc_addresses: [],
                    bcc_addresses: [],
                    is_sent: false
                });
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
     * This updates the draft with the specified message Id
     * @param {Number} messageId Message Id
     * @param {Object} data Message Properties
     */
    async updateDraft(messageId, data) {
        await this.validateDraft(messageId);
        // Stringify addresses from javascript array, since JSON is not
        // a supported column type in MySQL unlike PostgreSQL
        data.cc_addresses = JSON.stringify(data.cc_addresses);
        data.bcc_addresses = JSON.stringify(data.bcc_addresses);
        return this.knex('messages')
            .where('id', messageId)
            .update(Object.assign(data, {
                updated_at: this.knex.fn.now()
            })).then(data => {
                return Promise.resolve();
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
    * This fetches data for the specified draft
    * @param {Number} messageId Message Id
    */
    getDraft(messageId) {
        let criteria = {
            id: messageId,
            is_sent: false
        };

        return this.knex('messages')
            .where(criteria)
            .orderBy('updated_at', 'desc')
            .then(data => {
                data = data[0];
                // Convert addresses to javascript array, since JSON is not
                // a supported column type in MySQL unlike PostgreSQL
                data.cc_addresses = JSON.parse(data.cc_addresses);
                data.bcc_addresses = JSON.parse(data.bcc_addresses);
                return Promise.resolve(data);
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
     * This fetches messages for the specified user. If @param is_sent is undefined, then
     * all messages are retrieved for this user.
     * @param {Number} userId User Id
     * @param {Number | Boolean} is_sent Is Sent
     * @returns  {Promise<Array<Object>>} Drafts
     */
    listMessages(userId, is_sent) {
        let criteria = {
            user_id: userId
        };

        if (is_sent !== undefined) {
            criteria['is_sent'] = is_sent;
        }

        return this.knex('messages')
            .where(criteria)
            .select('id', 'subject', 'body_preview', 'is_sent', 'created_at', 'updated_at')
            .orderBy('updated_at', 'desc')
            .then(data => {
                return Promise.resolve(data);
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
    * This adds a provider error to this message
    * @param {Number} messageId Message Id
    * @param {String} provider_name The name of the mail provider that attempted to send the mail
    * @param {String} error_message The error message retrieved from the mail provider
    */
    async addMessageError(messageId, provider_name, error_message) {

        await this.validateDraft(messageId);
        let errors = await this.listMessageErrors(messageId);

        let error = {
            provider: provider_name,
            error: error_message,
            timestamp: Date.now()
        };

        //Append provider error to the end of the Array
        errors.push(error);

        return this.knex('messages')
            .where('id', messageId)
            .update({
                errors: JSON.stringify(errors),
                updated_at: this.knex.fn.now()
            })
            .then(data => {
                return Promise.resolve();
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
    * This fetches errors (if any) that has previously occured while attempting to send this message
    * @param {Number} messageId Message Id
    * @returns {Promise<Array<Object>>} Drafts
    */
    listMessageErrors(messageId) {
        return this.knex('messages')
            .where('id', messageId)
            .select('errors')
            .then(data => {
                if (data.length) {
                    return Promise.resolve(JSON.parse(data[0].errors));
                } else {
                    return Promise.reject('No messages were found with the specified id');
                }
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
     * This marks the draft as a sent message
     * @param {Number} messageId Message Id
     * @param {String} provider_name The name of the mail provider used to send the mail
     * @param {Object} provider_response The response retrieved from the mail provider
     */
    async updateAsSentMessage(messageId, provider_name, provider_response) {

        await this.validateDraft(messageId);
        return this.knex('messages')
            .where('id', messageId)
            .update({
                is_sent: true,
                provider_name: provider_name,
                provider_response: JSON.stringify(provider_response),
                updated_at: this.knex.fn.now()
            })
            .then(data => {
                return Promise.resolve();
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
     * This fetches the number of sent messages by the specified user
     * @param {Number} userId User Id
     * @returns {Promise<Number>} Drafts
     */
    messsagesCount(userId, is_sent) {

        let criteria = {
            user_id: userId
        };

        if (is_sent !== undefined) {
            criteria['is_sent'] = is_sent;
        }

        return this.knex('messages')
            .where(criteria)
            .count('id')
            .then(total => {
                return Promise.resolve(total[0]['count(`id`)']);
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
     * This function verifies that the specified message is a draft
     * @param {Number} messageId
     * @returns {Promise}
     */
    validateDraft(messageId) {
        return this.knex('messages')
            .where({ is_sent: false, id: messageId })
            .select('id')
            .then(data => {
                if (data.length) {
                    return Promise.resolve();
                } else {
                    return Promise.reject(errors.InvalidDraftMessage());
                }
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }

    /**
     * Returns the timeline for messages, given the necessary parameters
     * 
     * @param {Number} user_id User id
     * @param {Boolean} is_sent Is Sent
     * @param {String} start Start date
     * @param {String} end End date
     */
    getEmailDates(user_id, is_sent, start, end) {

        return this.knex('messages')
            .where({
                user_id: user_id,
                is_sent: is_sent
            })
            .whereBetween('updated_at', [start, end])
            .select('updated_at')
            .orderBy('updated_at', 'asc')
            .then(data => {
                let allDates = [];
                for(let i in data) {
                    allDates.push(data[i].updated_at);
                }
                return Promise.resolve(allDates);
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }
}

module.exports = MessagesModel;
