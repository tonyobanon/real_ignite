'use strict';

const errors = require('app/errors');
const httpStatus = require('http-status');

const utils = require('app/utils');

const fs = require('fs');
const TimeTrend = require('app/lib/time_trend');

class EmailController {

    /**
     * @param config Config Object
     * @param {winston.Logging} logging Instance of logging
     * @param metrics Instance of metrics client
     * @param service EmailService instance
     * @param messagesModel MessageModel instance
     * @param usersModel UsersModel instance
     * @param cache Redis instance
     * 
     */
    constructor(config, logging, metrics, service, messagesModel, usersModel, cache) {

        this.config = config;
        this.logging = logging;
        this.metrics = metrics;
        this.service = service;

        this.messagesModel = messagesModel;
        this.usersModel = usersModel;

        this.cache = cache;
    }

    async createDraft(req, res, next) {

        let user_id = req.params.user_id;

        try {

            let data = await this.messagesModel.createDraft(user_id);

            data.subject = false;
            data.body_preview = false;
            data.attachments = [];

            this.metrics.increment('emails.create_draft.ok', 1, [user_id, data.id]);
            this.logging.info(`Successfully create draft: ${data.id}: for user: ${user_id}`);

            res.send(httpStatus.OK, data);

        } catch (err) {

            this.metrics.increment('emails.create_draft.fail', 1, [user_id]);
            this.logging.error(`Error occured while creating draft for user: ${user_id}, error: ${err}`);

            res.send(httpStatus.INTERNAL_SERVER_ERROR, errors.InternalServerError(err));
        }
        next();
    }

    async updateDraft(req, res, next) {

        let user_id = req.params.user_id;
        let messageId = req.query.message_id;

        let data = {
            subject: req.body.subject,
            body: req.body.body,
            body_preview: req.body.body_preview,
            cc_addresses: req.body.cc_addresses,
            bcc_addresses: req.body.bcc_addresses
        };

        try {

            await this.messagesModel.updateDraft(messageId, data);

            this.metrics.increment('emails.update_draft.ok', 1, [user_id, messageId]);
            this.logging.info(`Successfully updated draft: ${messageId} for user: ${user_id}`);

            res.send(httpStatus.OK, messageId);

        } catch (err) {

            this.metrics.increment('emails.update_draft.fail', 1, [user_id, messageId]);
            this.logging.error(`Error occured while updating draft: ${messageId} for user: ${user_id}, error: ${err}`);

            res.send(httpStatus.INTERNAL_SERVER_ERROR, errors.InternalServerError(err));
        }
        next();

    }

    async getDraft(req, res, next) {

        let user_id = req.params.user_id;
        let messageId = req.query.message_id;

        try {

            let draft = await this.messagesModel.getDraft(messageId);

            let attachments = await this.getAttachments(user_id, messageId);

            draft.attachments = [];

            for (let i in attachments) {

                let attachment = attachments[i];

                draft.attachments.push({
                    id: attachment.id,
                    name: attachment.filename || attachment.name,
                    contentType: attachment.contentType
                });
            }

            this.metrics.increment('emails.get_draft.ok', 1, [user_id, messageId]);
            this.logging.info(`Successfully retrieved draft: ${messageId} for user: ${user_id}`);

            res.send(httpStatus.OK, draft);

        } catch (err) {

            this.metrics.increment('emails.get_draft.fail', 1, [user_id, messageId]);
            this.logging.error(`Error occured while retrieved draft: ${messageId} for user: ${user_id}, error: ${err}`);

            res.send(httpStatus.INTERNAL_SERVER_ERROR, errors.InternalServerError(err));
        }

        next();
    }

    async listMessages(req, res, next) {

        let user_id = req.params.user_id;
        let is_sent = req.query.is_sent;

        if (is_sent) {
            is_sent = is_sent === 'true' ? 1 : 0;
        }

        let metricTag = is_sent == 1 ? 'sent' : is_sent == 0 ? 'draft' : 'all';

        try {

            let messages = await this.messagesModel.listMessages(user_id, is_sent);

            this.metrics.increment('emails.list_messages.ok', 1, [user_id, metricTag]);
            this.logging.info(`Successfully retrieved ${metricTag} messages for user: ${user_id}`);

            res.send(httpStatus.OK, messages);

        } catch (err) {

            this.metrics.increment('emails.list_messages.fail', 1, [user_id, metricTag]);
            this.logging.error(`Error occured while retrieving ${metricTag} messages for user: ${user_id}, error: ${err}`);

            res.send(httpStatus.INTERNAL_SERVER_ERROR, errors.InternalServerError(err));
        }

        next();
    }

    async addAttachment(req, res, next) {

        let user_id = req.params.user_id;
        let messageId = req.query.message_id;
        let attachmentId = utils.generateShortId();

        let files = req.files;

        var file = files[Object.keys(files)[0]];

        var attachment = {
            id: attachmentId,
            filename: file.name,
            path: file.path,
            contentType: file.type
        };

        try {

            await this.cache.hset(`message_${messageId}_attachments`, attachmentId, JSON.stringify(attachment));

            let keys = await this.cache.hkeys(`message_${messageId}_attachments`);

            this.metrics.increment('emails.add_attachment.ok', 1, [user_id, messageId, attachmentId]);
            this.logging.info(`Successfully added attachment: ${attachmentId} to message: ${messageId}, user: ${user_id}, current_count: ${keys.length}`);

            res.send(httpStatus.OK, { id: attachmentId, count: keys.length });

        } catch (err) {

            this.metrics.increment('emails.add_attachment.fail', 1, [user_id, messageId, attachmentId]);
            this.logging.error(`Error occured while adding attachment: ${attachmentId} to message: ${messageId}, user: ${user_id}, error: ${err}`);

            res.send(httpStatus.INTERNAL_SERVER_ERROR, errors.InternalServerError(err));
        }

        next();
    }

    async removeAttachment(req, res, next) {

        let user_id = req.params.user_id;
        let messageId = req.query.message_id;
        let attachmentId = req.query.attachment_id;

        try {

            await this.cache.hdel(`message_${messageId}_attachments`, attachmentId);

            let keys = await this.cache.hkeys(`message_${messageId}_attachments`);

            this.metrics.increment('emails.remove_attachment.ok', 1, [user_id, messageId, attachmentId]);
            this.logging.info(`Successfully removed attachment: ${attachmentId} from message: ${messageId}, user: ${user_id}, current_count: ${keys.length}`);

            res.send(httpStatus.OK, { id: attachmentId, count: keys.length });

        } catch (err) {

            this.metrics.increment('emails.remove_attachment.fail', 1, [user_id, messageId, attachmentId]);
            this.logging.error(`Error occured while removing attachment: ${attachmentId} from message: ${messageId}, user: ${user_id}, error: ${err}`);

            res.send(httpStatus.INTERNAL_SERVER_ERROR, errors.InternalServerError(err));
        }

        next();
    }

    async removeAllAttachments(user_id, messageId) {

        try {

            await this.cache.del(`message_${messageId}_attachments`);

            this.metrics.increment('emails.remove_all_attachments.ok', 1, [user_id, messageId]);
            this.logging.info(`Successfully removed all attachments from message: ${messageId}, user: ${user_id}`);

            return true;

        } catch (err) {

            this.metrics.increment('emails.remove_all_attachments.fail', 1, [user_id, messageId]);
            this.logging.error(`Error occured while removing all attachments from message: ${messageId}, user: ${user_id}`);

            throw err;
        }
    }

    async getAttachments(user_id, messageId) {

        try {

            // Get attachments metadata from redis
            let attachmentsData = await this.cache.hgetall(`message_${messageId}_attachments`);

            var attachments = [];
            for (var k in attachmentsData) {
                var attachment = JSON.parse(attachmentsData[k]);
                attachments.push(attachment);
            }

            this.metrics.increment('emails.get_attachments.ok', 1, [user_id, messageId]);
            this.logging.info(`Successfully retrieved ${attachments.length} attachment(s) for message: ${messageId}, user: ${user_id}`);

            return attachments;

        } catch (err) {

            this.metrics.increment('emails.get_attachments.fail', 1, [user_id, messageId]);
            this.logging.error(`Error occured while retrieving attachment(s) for message: ${messageId}, user: ${user_id}, error: ${err}`);

            throw err;
        }
    }

    async sendMail(req, res, next) {

        let userId = req.params.user_id;

        let messageId = parseInt(req.query.message_id);

        let messageData = await this.messagesModel.getDraft(messageId);

        // Validate Parameters

        let subject = messageData.subject;
        let body = messageData.body;
        let senderName = await this.usersModel.getUserName(userId);;

        let ccAddresses = messageData.cc_addresses;
        let bccAddresses = messageData.bcc_addresses;

        if (!subject || !body || !ccAddresses || !bccAddresses) {
            res.send(httpStatus.BAD_REQUEST, errors.InvalidParams('Please enter a valid body and destination address(es)'));
            return next();
        }

        let toAddress;

        if (ccAddresses.length) {
            toAddress = ccAddresses.shift();
        } else {
            toAddress = bccAddresses.shift();
        }

        let service = this.service
            .setMessageId(messageId)
            .setSubject(subject)
            .setBody(body)
            .setSenderName(senderName)
            .setToAddress(toAddress);

        if (bccAddresses instanceof Array) {
            for (let i in bccAddresses) {
                service.addBccAddress(bccAddresses[i]);
            }
        }

        if (ccAddresses instanceof Array) {
            for (let i in ccAddresses) {
                service.addCcAddress(ccAddresses[i]);
            }
        }

        let attachments = await this.getAttachments(userId, messageId);

        for (let i in attachments) {
            service.addAttachment(attachments[i]);
        }

        try {

            let response = await service.sendMail();

            let provider_name = response.provider_name;

            this.logging.info(`Successfully sent email message: '${messageId}'  using ${provider_name}, attachments_count: ${attachments.length}, user: ${userId}`);

            // Cleanup attachment files in the temp directory
            for (let i in attachments) {
                fs.unlink(attachments[i].path);
            }

            // Delete attachment(s) metadata in redis
            await this.removeAllAttachments(userId, messageId);

            this.metrics.increment('emails.send_mail.ok', 1, [userId, messageId]);

            res.send(httpStatus.OK, response);

        } catch (err) {

            this.metrics.increment('emails.send_mail.fail', 1, [userId, messageId]);
            this.logging.error(`Error occured while sending email message: ${messageId}, attachments_count: ${attachments.length}, user: ${userId}, error: ${err}`);

            res.send(httpStatus.INTERNAL_SERVER_ERROR, errors.InvalidParams(err));
        }

        next();
    }

    async listMessageErrors(req, res, next) {

        let userId = req.params.user_id;
        let messageId = req.query.message_id;

        try {

            let data = await this.messagesModel.listMessageErrors(messageId);

            this.metrics.increment('emails.list_message_errors.ok', 1, [userId, messageId]);
            this.logging.info(`Successfully retrieved ${data.length} errors for message: ${messageId}, user: ${userId}`);

            res.send(httpStatus.OK, data);

        } catch (err) {

            this.metrics.increment('emails.list_message_errors.fail', 1, [userId, messageId]);
            this.logging.error(`Error occured while retrieving errors for message: ${messageId}, user: ${userId}, error: ${err}`);

            res.send(httpStatus.INTERNAL_SERVER_ERROR, errors.InternalServerError(err));
        }

        next();
    }

    async messsagesCount(req, res, next) {

        let userId = req.params.user_id;
        let is_sent = req.query.is_sent;

        if (is_sent) {
            is_sent = is_sent === 'true' ? 1 : 0;
        }

        try {

            let data = await this.messagesModel.messsagesCount(userId, is_sent);

            this.metrics.increment('emails.get_message_count.ok', 1, [userId]);
            this.logging.info(`Successfully retrieved message count for user: ${userId}, count: ${data}`);

            res.send(httpStatus.OK, data);

        } catch (err) {

            this.metrics.increment('emails.get_message_count.fail', 1, [userId]);
            this.logging.error(`Error occured while retrieving message count for user: ${userId}, error: ${err}`);

            res.send(httpStatus.INTERNAL_SERVER_ERROR, errors.InternalServerError(err));
        }

        next();
    }

    async getUserActivityTrend(req, res, next) {

        let userId = req.params.user_id;

        let start = TimeTrend.getStartDate();
        let end = TimeTrend.getEndDate();

        let draftDates = await this.messagesModel.getEmailDates(userId, 0, start, end);
        let outboxDates = await this.messagesModel.getEmailDates(userId, 1, start, end);

        let maxDataPoints = 7;

        let outboxTrend = new TimeTrend(outboxDates, maxDataPoints).computeOptimalFrequency();
        let draftTrend = new TimeTrend(draftDates, maxDataPoints).setFrequency(outboxTrend.frequency);

        res.send(httpStatus.OK, {

            stats: {
                emails_created: await this.messagesModel.messsagesCount(userId),
                emails_sent: await this.messagesModel.messsagesCount(userId, 1),
            },
            trend: {
            labels: draftTrend.computeTrendLabels(),
            series: [draftTrend.computeTrendValues(), outboxTrend.computeTrendValues()]
            }
        });
    }
}

module.exports = EmailController;
