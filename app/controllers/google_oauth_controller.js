'use strict';

let errors = require('app/errors');
let httpStatus = require('http-status');
const { OAuth2Client } = require('google-auth-library');
const _clone = require('lodash.clonedeep');

class GoogleOAuthController {

    /**
     * @param config Config Object
     * @param {winston.Logging} logging Instance of logging
     * @param metrics Instance of metrics
     * @param authService Auth Service Instance
     */
    constructor(config, logging, metrics, authService) {

        this.config = config;
        this.logging = logging;
        this.metrics = metrics;
        this.authService = authService;

        const redirectUrl = `${this.config.web.site_url}${this.config.google_oauth.redirect_url}`;

        // create an oAuth client to authorize the API call
        this.oAuth2Client = new OAuth2Client(
            this.config.google_oauth.client_id,
            this.config.google_oauth.client_secret,
            redirectUrl
        );
    }

    /**
     * Redirect users to the google login page
     * .
     * @param  {Request}  req  The http request object
     * @param  {Response} res  The http response object
     * @param  {Function} next Callback to indicate that the next middleware can be initiated
     */
    redirect(req, res, next) {
        this.metrics.increment('auth.oauth_login_start', 1, ['google']);
        this.logging.info('Starting Google OAuth Login flow');
        // Generate the url that will be used for the consent dialog.
        const authorizeUrl = this.oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['profile', 'email']
        });
        res.redirect(authorizeUrl, next);
    }

    /**
     * This retrieves the retrieves the OAuth2 Token from Google
     * .
     * @param  {Request}  req  The http request object
     * @param  {Response} res  The http response object
     * @param  {Function} next Callback to indicate that the next middleware can be initiated
     */
    async callback(req, res, next) {

        let authCode = req.query.code;

        // Create new object from oAuth2Client, and be sure to set the credentials on it
        let authClient = _clone(this.oAuth2Client, true);

        // Now that we have the code, use that to acquire tokens.
        let r = await authClient.getToken(authCode);

        authClient.setCredentials(r.tokens);

        //@Todo: Cleanup this up
        let credentials = authClient.credentials;
        credentials['idToken'] = credentials.id_token;

        let ticket = await authClient.verifyIdToken(credentials);

        let jwtToken = await this.authService.oauthLogin(ticket.payload);

        this.metrics.increment('auth.oauth_login_complete', 1, ['google']);
        this.logging.info(`Google OAuth Login successful for user: ${ticket.payload.email}`);

        //Add Jwt Token as Cookie
        res.setCookie('user_auth', jwtToken, {
            path: '/',
            maxAge: this.config.web.session_duration
        });

        //Redirect back to homepage, (now as a logged in user)
        res.redirect('/', next);
    }
}

module.exports = GoogleOAuthController;
