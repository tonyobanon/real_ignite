'use strict';

/**
 * This is the super class for all mail providers. This API provides an abstraction
 * to seperate email providers, and does not know of the existence of any such provider.
 * Individual email providers are dynamically registered.
 */

class EmailService {

    /**
     * If this constructor is used directly in application code, then the object returned is a no-op.
     * For more information, see @method send(). Developers should use the @method getInstance() factory
     * method instead
     *
     * @param {Object} config The Configuration Object
     * @param {winston.Logger} logger The Logger instance
     * @param {MessagesModel} model Messages Model instance
     * @param {StatsdClient} metrics  The StatsD client instance used for metrics and telemetry
     */
    constructor(config, logger, metrics, model) {

        this.config = config;
        this.logger = logger;
        this.metrics = metrics;
        this.model = model;

        this.subject = '';

        this.attachments = [];

        this.sender = config.sender_address;
        this.ccAddresses = [];
        this.bccAddresses = [];

        //The number the retries done on the current provider
        this.retryCount = 0;

        // The total number of retries accross all providers
        this.totalRetryCount = 0;

        /**
         *  This helps us to avoid recursing infinitely while trying to hot-swap between providers,
         *  It provides provides a way to ascertain that the same provider is never used more than once on
         *  a single EmailService instance (excluding retries) .
         *  For more information see @method getProviderDelegate()
         */
        this.provider_indentity = this.name();
    }

    /**
     * This return a new Email Service Instance
     *
     * @param {Object} config The Configuration Object
     * @param {winston.Logger} logger The Logger instance
     * @param {StatsdClient} metrics  The StatsD client instance used for metrics and telemetry
     * @param {string} provider_name The provider to instantiate this instance with (Optional)
     */
    static getInstance(config, logger, metrics, model, provider_name) {

        if (EmailService.getProviderNames().length === 0) {
            EmailService.init(config.provider_names, logger);
        }

        // The email provider instance to return
        let provider;

        if (provider_name) {
            
            let provider_class = EmailService.getProvider(provider_name);
            if (provider_class) {
                provider = new provider_class(config, logger, metrics, model);
            }

        } else {

            let providerNames = EmailService.getProviderNames();

            //Look for an available provider to use
            for (let i in providerNames) {
                provider_name = providerNames[i];
                let provider_class = EmailService.getProvider(provider_name);
                if (provider_class) {
                    provider = new provider_class(config, logger, metrics, model);
                    if (provider.enabled()) {
                        break;
                    }
                }
                continue;
            }
        }

        if (provider && provider.enabled()) {
            logger.info(`Successfully loaded provider: ${provider_name}`);
            return provider;
        } else {
            logger.error('There are no email providers available');
            return new EmailService(config, logger, metrics, model);
        }
    }

    /**
     * Gets a provider class from the cache
     * @param {String} name The provider name
     * @returns {EmailService} The relevant class for this provider
     */
    static getProvider(name) {
        return EmailService.providerCache.get(name);
    }

    /**
     * Adds a provider class to the cache
     * @param {String} name The provider name
     * @param {EmailService} clazz relevant class for this provider
     */
    static addProvider(name, clazz) {
        return EmailService.providerCache.put(name, clazz);
    }

    /**
     * Gets all provider na,mes from the cache
     */
    static getProviderNames() {
        let names = [];
        let keys = EmailService.providerCache.keys();
        for (let i in keys) {
            names.push(keys[i]);
        }

        return names;
    }

    /**
     * Gets all provider classes from the cache
     */
    static getProviders() {
        let providers = [];
        let keys = EmailService.providerCache.keys();
        for (let i in keys) {
            providers.push(EmailService.providerCache.get(keys[i]));
        }

        return providers;
    }

    /**
     * This registers available email service providers
     */
    static init(provider_names, logger) {

        //Dynamically load available providers

        for (var i in provider_names) {

            var provider_name = provider_names[i];
            var provider_class = require(`app/mail_providers/${provider_name}`);

            EmailService.addProvider(provider_name, provider_class);
        }
    }

    name() {
        return 'None';
    }

    enabled() {
        return true;
    }

    supportMultipleAddresses() {
        return true;
    }

    /**
     * This function calls the service endpoint using the node mailer API for consistency. If
     * for some reason, a provider does not support making calls via a nodemailer transport, then
     * this method can be overriden, else @function transport() method should be used in the subclass
     */
    send() {

        if (!(this.transport instanceof Function)) {

            // Do nothing, this object was possibly initialized directly, instead of via
            // @function getInstance()
            Promise.resolve({});

        } else {

            // Based addresses, based on individual provider requirements
            let toAddress = this.parseAddress(this.getToAddress());
            let ccAddresses = this.parseAddress(this.getCcAddresses());
            let bccAddresses = this.parseAddress(this.getBccAddresses());

            var mailOptions = {
                from: this.getSender(),
                subject: this.getSubject(),
                html: this.getBody(),
                to: `${this.sender_name} <${toAddress}>`,
                attachments: this.getAttachments()
            };

            if (ccAddresses) {
                mailOptions['cc'] = ccAddresses;
            }

            if (bccAddresses) {
                mailOptions['bcc'] = bccAddresses;
            }

            return new Promise((resolve, reject) => {

                this.transport().sendMail(mailOptions, function (err, info) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(info);
                    }
                });
            });
        }
    }

    /**
     * This function validates the user parameters, then delegates to @function _sendMail
     * @see _sendMail()
     */
    sendMail() {

        //Validate user parameters
        this.validateParams();

        return this._sendMail();
    }

    /**
    * This sends the email by calling the current provider. It makes best efforts to
    * perform automatic failover behind the scenes if the current delegate is failing.
    * To ensure a fail fast behaviour, set config.retry_threshold to 0, to avoid retrying
    * the same delegate multiple times before hitting the threshold.
    *
    * @returns {Promise} The promise containing the final result of this operation
    */
    _sendMail() {

        let provider_name = this.name();
        this.logger.info(`Sending email using provider: ${provider_name}`);

        // Call the provider
        return this.send().then(data => {

            // Update status to 'sent'
            this.model.updateAsSentMessage(this.messageId, provider_name, data);

            return Promise.resolve({
                provider_name: provider_name
            });

        }).catch(async err => {

            this.logger.info(`Emailing attempt for message: '${this.messageId}' failed with error: ${err.message}`);

            await this.model.addMessageError(this.messageId, provider_name, err.message);

            // Hot swap with another provider
            //First, we need to get a suitable provider to replace this with
            let delegate = this.getProviderDelegate();

            if (delegate == null) {
                let err = 'No suitable provider is available to handle this request..';
                this.logger.error(err);
                return Promise.reject(new Error(err));
            }

            if (this.name() !== delegate.name()) {

                this.logger.info(`Switching to provider: ${delegate.name()}`);

                this.name = delegate.name;
                this.supportMultipleAddresses = delegate.supportMultipleAddresses;

                if (delegate.transport instanceof Function) {
                    this.transport = delegate.transport;

                } else if (delegate.send instanceof Function) {
                    this.send = delegate.send;
                }
            }

            return this._sendMail();
        });
    }

    /**
     * This function returns an alternative service provider to use for this EmailService instance
     * @returns {EmailService}
     */
    getProviderDelegate() {

        // If a service retry threshold is set, check the retry counter to know how many
        // times this service provider has been retried before switching to another one

        if (this.config.retry_threshold > 0) {
            if (this.retryCount < this.config.retry_threshold) {

                this.totalRetryCount++;
                this.retryCount++;

                return this;
            }
        }

        const providerNames = EmailService.getProviderNames();

        // Iterate through all available providers
        for (var k in providerNames) {

            var name = providerNames[k];

            //Here, we are checking to see if provider k has been used before on this instance
            if (this.provider_indentity.includes(name)) {
                continue;
            } else {

                //Here, we are adding provider k to the list of used providers, so that we
                // are not going to use this provider again for this instance
                this.provider_indentity += `, ${name}`;

                let provider_class = EmailService.getProvider(name);

                let provider = new provider_class(this.config, this.logger, this.metrics);
                if (provider.enabled()) {

                    this.totalRetryCount++;
                    this.retryCount = 0;

                    return provider;
                }
            }
        }

        //No suitable provider was found
        return null;
    }

    isParamsValid() {
        return (this.getRecipients().length > 0 && this.subject && this.body && this.messageId);
    }

    validateParams() {
        if (!this.isParamsValid()) {
            throw new Error('Please verify that the parameters provided are valid');
        }
    }

    asString() {

        let params = {
            subject: this.getSubject(),
            sender: this.getSender(),
            recipients: this.getRecipients(),
            retry_count: this.retryCount,
            total_retry_count: this.totalRetryCount
        };

        return JSON.stringify(params);
    }

    setMessageId(messageId) {
        this.messageId = messageId;
        return this;
    }

    getMessageId() {
        return this.messageId;
    }

    /**
     * Add an attachment
     */
    addAttachment(attachment) {
        this.attachments.push(attachment);
        return this;
    }

    /**
    * Get the email title
    */
    getAttachments() {
        return this.attachments;
    }

    /**
     * Set the email subject
     * (default "")
     * @param {String} subject
     */
    setSubject(subject) {
        this.subject = subject;
        return this;
    }
    /**
    * Get the email title
    */
    getSubject() {
        return this.subject;
    }

    /**
     * Set the email body
     * @param {String} body
     */
    setBody(body) {
        this.body = body;
        return this;
    }
    /**
    * Get the email body
    */
    getBody() {
        return this.body;
    }

    /**
    * Sets the Sender field
    * @param {String} sender
    */
    setSender(sender) {
        this.sender = sender;
        return this;
    }
    /**
     * Gets the Sender field
    */
    getSender() {
        return this.sender;
    }

    /**
    * Sets the Sender_Name field
    * @param {String} sender
    */
    setSenderName(sender_name) {
        this.sender_name = sender_name;
        return this;
    }

    /**
    * Gets the Sender_Name field
    */
    getSenderName() {
        return this.sender_name;
    }

    /**
     * Set to the TO Address field
     * @param {String} toAddress
     */
    setToAddress(toAddress) {
        this.toAddress = toAddress;
        return this;
    }

    /**
     * Gets TO Address field
    */
    getToAddress() {
        return this.toAddress;
    }

    /**
     * Sets the BCC Addresses field
     * @param {Array<String>} bccAddress
     */
    addBccAddress(bccAddress) {
        this.bccAddresses.push(bccAddress);
        return this;
    }
    /**
     * Gets the BCC Addresses field
    */
    getBccAddresses() {
        return this.bccAddresses;
    }

    /**
    * Sets the CC Addresses field
    * @param {Array<String>} ccAddress
    */
    addCcAddress(ccAddress) {
        this.ccAddresses.push(ccAddress);
        return this;
    }

    /**
     * Gets the CC Addresses field
     */
    getCcAddresses() {
        return this.ccAddresses;
    }

    /**
     * This joins all recipient addresses into one single array
     * @returns {Array<String>}
     */
    getRecipients() {
        if (!(this.toAddress && this.toAddress.constructor.name === 'String'
            && this.bccAddresses instanceof Array
            && this.ccAddresses instanceof Array)) {
            throw new Error('All recipient addresses must be valid');
        }

        let array = this.ccAddresses.concat(this.bccAddresses);
        array.push(this.toAddress);

        return array;
    }

    /**
     * Based on individual provider requirements, this helper function returns a properly
     * formatted address
     *
     * @param {String} address The address to parse
     */
    parseAddress(address) {

        switch (this.supportMultipleAddresses()) {

            case true:
                if (address.constructor.name === 'String') {
                    return [address];
                }

                break;

            case false:
                if (address instanceof Array) {
                    if (!address.length) {
                        return undefined;
                    } else {
                        return address[0];
                    }
                }

                break;
        }

        return address;
    }

}

EmailService.providerCache = require('memory-cache');
module.exports = EmailService;
