'use strict';
/**
 * Externalised configuration represented as a valid JSON structure, resolving to environment variables.
 * @see dependent config.js and README.md for the exports.
 * @type {object}
 */

const $ = {
    api: {
        //Todo: Create seperate throttle settings for APIs
    },
    web: {
        site_url: process.env.SITE_URL,
        port: process.env.WEB_PORT,
        session_duration: parseInt(process.env.WEB_SESSION_DURATION) || 60 * 60 * 24 * 3,
        throttle_burst: parseInt(process.env.WEB_THROTTLE_BURST) || 10,
        throttle_rate: parseInt(process.env.WEB_THROTTLE_RATE) || 5,
        max_upload_size: parseInt(process.env.WEB_MAX_UPLOAD_SIZE)
    },
    logging: {
        level: process.env.LOGGING_LEVEL,
        file: process.env.LOGGING_FILE,
        console: process.env.LOGGING_CONSOLE
    },
    statsd: {
        host: process.env.STATSD_PORT_8125_UDP_ADDR || process.env.STATSD_HOST,
        port: process.env.STATSD_PORT_8125_UDP_PORT || process.env.STATSD_PORT,
        scope: process.env.STATSD_SCOPE || 'real_ignite',
        debug: process.env.STATSD_DEBUG
    },
    jwt: {
        issuer: 'real_ignite',
        algorithm: process.env.JWT_ALGORITHM,
        token_expiry: parseInt(process.env.JWT_TOKEN_EXPIRY_PERIOD),
        real_ignite_private_key: process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        real_ignite_public_key: process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n')
    },

    mysql: {
        connection: {
            host: process.env.DATABASE_HOST,
            port: process.env.DATABASE_PORT,
            database: process.env.MYSQL_DATABASE,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            debug: process.env.DATABASE_DEBUG ? ['ComQueryPacket'] : false
        },
        pool: {
            min: (process.env.DATABASE_POOL_MIN) ? parseInt(process.env.DATABASE_POOL_MIN) : 2,
            max: (process.env.DATABASE_POOL_MAX) ? parseInt(process.env.DATABASE_POOL_MAX) : 2
        }
    },

    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379,
        database: process.env.REDIS_DATABASE || 0
    },

    google_oauth: {
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_url: process.env.GOOGLE_OAUTH_REDIRECT_URL
    },

    email_service: {

        retry_threshold: parseInt(process.env.EMAIL_SERVICE_RETRY_THRESHOLD),

        sender_address: process.env.EMAIL_SERVICE_SENDER_ADDRESS || 'services@realignite.com',
        provider_names: ['amazon_ses', 'mailgun', 'sendgrid'],

        amazon_ses: {
            region: process.env.AWS_REGION,
            access_key_id: process.env.AWS_ACCESS_KEY_ID,
            secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
        },

        mailgun: {
            api_key: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_DOMAIN
        },

        sendgrid: {
            api_key: process.env.SENDGRID_API_KEY
        }
    }

};

module.exports = $;
