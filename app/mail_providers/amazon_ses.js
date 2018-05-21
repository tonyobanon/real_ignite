'use strict';
const EmailService = require('app/services/email_service');

/**
 * AmazonSesProvider is a concrete subclass of EmailService, and has access to all the
  * email parameters provided by the user. Notice how the transport function is overriden here. it's cleaner to just
 * override @function transport while the superclass performs the actual request
 * in @function EmailService.send via the nodemailer API.
 * For other scenarios, see the SendGrid provider
 */
class AmazonSesProvider extends EmailService {

    name() {
        return 'amazon_ses';
    }
    
    /**
     * This function returns a nodemailer transport that wraps around Amazon SES. Notice how
     * we call @function require() inside the function. This is because we need to make this
     * function self-contained, such that it has a refernce to all the object(s) it needs. This
     * is necessary because when we are hot-swapping between mail providers, this function will
     * be placed in an entirely different object (that will always inherit from @class EmailService)
     */
    transport() {
        const aws = require('aws-sdk');
        const nodemailer = require('nodemailer');
        const ses = new aws.SES();
        return nodemailer.createTransport({
            SES: ses
        });
    }

}

module.exports = AmazonSesProvider;
