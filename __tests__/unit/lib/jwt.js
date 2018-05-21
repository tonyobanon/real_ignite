'use strict';

const sinon = require('sinon');
const joi = require('joi');

const mockery = require('mockery');

const jwtFixtures = require('__tests__/fixtures/lib/jwt');

const mocks = require('__tests__/helpers/mocks');

const mockedConfig = mocks.mockedConfig;
const mockedLogger = mocks.mockedLogger;
const mockedMetrics = mocks.mockedMetrics;

const errors = require('app/errors');
const jsonwebtoken = require('jsonwebtoken');

const fakeJwtIssuer = 'invalid_issuer';

const Jwt = require('app/lib/jwt');
let jwt;

const sandbox = sinon.createSandbox();

describe('Jwt', () => {

    beforeAll(() => {
        jwt = new Jwt(mockedConfig, mockedLogger, mockedMetrics, jsonwebtoken);
    });

    beforeEach(() => {
        mockery.enable({
            useCleanCache: true,
            warnOnReplace: false,
            warnOnUnregistered: false
        });
    });

    afterEach(() => {
        // completely restore all fakes created through the sandbox
        sandbox.restore();

        mockery.deregisterAll();
        mockery.disable();
    });

    describe('.createToken', () => {


        test(
            'should correctly return a jwt token each time, given the same input data',
            async (done) => {

                let tokenData = jwtFixtures.jwtTokenData;

                var tokenA = await jwt.createToken(tokenData.jti);
                var tokenB = await jwt.createToken(tokenData.jti);

                expect(tokenA).toEqual(tokenB);
                done();
            }
        );

        test('should fail if the issuer private key was not found', () => {

            sandbox.stub(jwt.config.jwt, jwtFixtures.jwtIssuer + '_private_key').value(undefined);

            let tokenData = jwtFixtures.jwtTokenData;

            expect.assertions(1);
            return expect(jwt.createToken(tokenData.jti)).rejects.toBeInstanceOf(errors.IssuerPrivateKeyNotFound);
        });

    });

    describe('.verifyToken', () => {

        test(
            'should return the decoded data of the jwt token, in the proper format',
            async () => {

                var randomJti = Math.floor(Math.random() * 20);
                var token = await jwt.createToken(randomJti);

                return jwt.verifyToken(token)
                    .then((tokenData) => {
                        let schema = {
                            jti: joi.number().required(),
                            iss: joi.string().required(),
                            iat: joi.number().required(),
                            exp: joi.number().required()
                        };
                        joi.assert(tokenData, schema);
                    });
            }
        );

        test('should fail if the issuer public key was not found', () => {

            sandbox.stub(jwt.config.jwt, jwtFixtures.jwtIssuer + '_public_key').value(undefined);

            let tokenData = jwtFixtures.jwtTokenData;

            expect.assertions(1);
            return expect(jwt.verifyToken(jwtFixtures.jwtToken)).rejects.toBeInstanceOf(errors.IssuerPublicKeyNotFound);
        });

        test('should fail if the jwt token is invalid', () => {
            expect.assertions(1);
            return expect(jwt.verifyToken(jwtFixtures.invalidJwtToken)).rejects.toBeInstanceOf(errors.InvalidJwt);
        });

        test('should fail if there is a mismatch in the jwt token issuer', async () => {

            // Generate Jwt
            var randomJti = Math.floor(Math.random() * 20);
            var token = await jwt.createToken(randomJti);

            sandbox.stub(jwt.config.jwt, 'issuer').value(fakeJwtIssuer);

            // Add public key for fake issuer, we cannot stub since it's a non-existent property
            jwt.config.jwt[fakeJwtIssuer + '_public_key'] = jwt.config.jwt[jwtFixtures.jwtIssuer + '_public_key'];

            expect.assertions(1);
            return expect(jwt.verifyToken(token)).rejects.toBeInstanceOf(errors.JwtTokenIssuerMismatch);
        });


    });

});
