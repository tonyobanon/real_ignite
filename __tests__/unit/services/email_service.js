'use strict';

const sinon = require('sinon');
const joi = require('joi');

const mockery = require('mockery');

const mocks = require('__tests__/helpers/mocks');

const mockedConfig = mocks.mockedConfig.email_service;
const mockedLogger = mocks.mockedLogger;
const mockedMetrics = mocks.mockedMetrics;
const mockedModelInstance = mocks.mockedModelInstance;

const sandbox = sinon.createSandbox();

const fakeProvider = 'xyz';

const realProvider = 'amazon_ses';
const realProviderClass = 'AmazonSesProvider';

const fakeMessageId = 123;

describe('.EmailService', () => {

    /**
     *  This helper methods instantiates a service instance
     * @param {String} name (Optional) Email provider to use for this instance
     */
    function getServiceInstance(name) {

        let instance = require('app/services/email_service').getInstance(
            mockedConfig,
            mockedLogger,
            mockedMetrics,
            mockedModelInstance,
            name);

        return instance
            .setMessageId(fakeMessageId)
            .setSubject('hello')
            .setBody('My name is Tony, I am a Software Engineer')
            .setSenderName('Anthony')
            .setToAddress('anthony.anyanwu.o@gmail.com')
            .addCcAddress('tonyobanon@gmail.com');
    }

    beforeAll(() => {

        mockery.enable({
            useCleanCache: true,
            warnOnReplace: false,
            warnOnUnregistered: false
        });

    });

    afterAll(() => {

        mockery.deregisterAll();
        mockery.disable();
    });

    beforeEach(() => {
    });

    afterEach(() => {

        // completely restore all fakes created through the sandbox
        sandbox.restore();
    });

    describe('.getInstance', () => {

        test(
            'Should return a concrete instance of EmailService an invalid provider is passed',
            done => {
                var instance = getServiceInstance(fakeProvider);
                expect(instance.constructor.name).toBe('EmailService');
                done();
            }
        );

        test(
            'If a valid provider name is passed, then the provider should be returned',
            done => {
                sandbox.stub(mockedConfig, 'provider_names').value([]);
                var instance = getServiceInstance(realProvider);
                expect(instance.constructor.name).toBe(realProviderClass);
                done();
            }
        );
    });

    describe('.sendMail', () => {

        test(
            'Should fail if one or more invalid parameters are specified',
            () => {

                let instance = getServiceInstance().setBody(null);

                let spy = sinon.spy(instance, 'validateParams');

                expect(() => {

                    instance.sendMail().then(() => {
                        expect(spy.called).toBeTruthy();
                        expect(spy.threw()).toBeTruthy();
                    });

                }).toThrow();
            }
        );

        test('Should fail if there are no valid recipients', () => {

            let instance = getServiceInstance().setToAddress(null);

            let spy = sinon.spy(instance, 'getRecipients');

            expect(() => {

                instance.sendMail().then(() => {
                    expect(spy.called).toBeTruthy();
                    expect(spy.threw()).toBeTruthy();
                });

            }).toThrow();            
        });






    });

});
