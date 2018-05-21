'use strict';

let sinon   = require('sinon');
let expect  = require('chai').expect;
let mockery = require('mockery');

let mocks = require('__tests__/helpers/mocks');
let mockedLogger = mocks.mockedLogger;

let sandbox = sinon.createSandbox();

mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false
});

// fake joi object
let joiMock = {
    validate: function () {
        return true;
    }
};

// fake joi object
let failJoiMock = {
    meh: {},
    validate: function () {
        return {
            error: {
                details: [
                    'fake error message'
                ]
            }
        };
    }
};

// fake request object
let request = {
    body: {
    },
    route: {
        validation: {
            body: {
                email: null
            }
        }
    }
};

let badRequest = {
    route: {
        validation: {
            fakeProperty: {

            }
        }
    }
};

//fake response object
let response = {
    status: function () {},

    send: function () {}
};

// mock callback
let next;

let validationMiddleware     = require('app/lib/validation').paramValidation(joiMock, mockedLogger, {});
let validationMiddlewareFail = require('app/lib/validation').paramValidation(failJoiMock, mockedLogger, {});

describe('Parameter Validation Middleware', () => {

    beforeEach(() => {
        next = sandbox.stub();
    });

    afterEach(() => {
        // remove any spies and stubbed methods
        sandbox.restore();
    });

    describe('next called', () => {

        afterEach(() => {
            expect(next.called).to.equal(true);
        });

        test('validate with no properties', () => {

            sandbox.stub(request.route, 'validation').returns(undefined);

            validationMiddleware(request, response, next);
        });

        test('validate with supported property', () => {

            sandbox.stub(request.route.validation.body, 'email').returns(joiMock);

            validationMiddleware(request, response, next);
        });

    });

    describe('next not called', () => {

        afterEach(() => {
            expect(next.called).to.equal(false);
        });

        test('validate with unsupported property', () => {

            expect(function () {
                validationMiddleware(badRequest, response, next);
            }).to.throw('An unsupported validation key was set in route');
        });

        test('failed validation', () => {

            sandbox.stub(request.route.validation.body, 'email').returns(failJoiMock);

            validationMiddlewareFail(request, response, next);
        });

        // it('validate with empty body', function () {

        //     sandbox.stub(request, 'body').returns(undefined);

        //     validationMiddleware(request, response, next);
        // });

    });
});
