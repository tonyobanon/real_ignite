'use strict';
const EmailService = require('app/services/email_service');

/**
  * SendGridProvider is a concrete subclass of EmailService, and has access to all the
  * email parameters provided by the user. Notice how this class does not use the transport() function.
  * Since @link https://github.com/sendgrid/nodemailer-sendgrid-transport became
  * deprecated, the SendGrid team encourages developers to use the @sendgrid/mail library
  * directly instead. So this is why we had to directly override @method EmailService.send
  * unlike we did in the other providers
  */
class SendGridProvider extends EmailService {

    name() {
        return 'sendgrid';
    }

    /**
     * This functions contains the logic to call the SendGrid endpoint.
     * @returns {Promise}
     */
    send() {

        const utils = require('app/utils');
        let apiKey = this.config[this.name()].api_key;

        const sendgrid = require('@sendgrid/mail');
        sendgrid.setApiKey(apiKey);

        // The v3 web API requires that we provide attachment contents as a Base64 encoded content
        
        let attachments = this.getAttachments();
        let base64_attachments = [];

        for(let id in attachments) {
            let attachment = attachments[id];
            base64_attachments.push({
                content_id : attachment.id,
                type: attachment.contentType,
                filename: attachment.filename,
                content: utils.base64_encode(attachment.path)
            });
        }

        const msg = {
            to: this.getToAddress(),
            cc: this.getCcAddresses(),
            bcc: this.getBccAddresses(),
            from: this.getSender(),
            subject: this.getSubject(),
            html: this.getBody(),
            attachments: base64_attachments
        };

        return sendgrid.send(msg);
    }
}

module.exports = SendGridProvider;
