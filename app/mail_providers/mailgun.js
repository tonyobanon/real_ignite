'use strict';
const EmailService = require('app/services/email_service');

/**
  * MailGunProvider is a concrete subclass of EmailService, and has access to all the
  * email parameters provided by the user. Notice how the transport function is overriden here.
  * it's cleaner to just override @function transport while the superclass performs the
  * actual request in @function EmailService.send via the nodemailer API.
  * For other scenarios, see the SendGrid provider
  */
class MailGunProvider extends EmailService {

    name() {
        return 'mailgun';
    }

    supportMultipleAddresses() {
        return false;
    }

    /**
     * This function returns a nodemailer transport that wraps around MailGun. Notice how
     * we call @function require() inside the function. This is because we need to make this
     * function self-contained, such that it has a refernce to all the object(s) it needs. This
     * is necessary because when we are hot-swapping between mail providers, this function will
     * be placed in an entirely different object (that will always inherit from @class EmailService)
     */
    transport() {

        const nodemailer = require('nodemailer');
        const mailgunTransport = require('nodemailer-mailgun-transport');

        const configuration = this.config[this.name()];
        const auth = {
            auth: {
                api_key: configuration.api_key,
                domain: configuration.domain
            }
        };
        return nodemailer.createTransport(mailgunTransport(auth));
    }

}

module.exports = MailGunProvider;
