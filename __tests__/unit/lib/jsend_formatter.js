'use strict';

let expect      = require('chai').expect;
let formatter   = require('app/lib/jsend_formatter');
let createError = require('custom-error-generator');

// stub of the request being provided to the formatter
let request  = {};

// stub of the response being provided to the formatter
let response = {
    header: function () {}
};

describe('JSend formatter', () => {

    test('jsend error response returned when error is sent', done => {

        let HelloWorldError = createError('HelloWorldError', { code: 'HELLO_WORLD' });

        formatter(request, response, new HelloWorldError('Hello World'), function (error, result) {

            expect(typeof result).to.equal('string');

            // attempt to parse the string as json
            let resultObj = JSON.parse(result);

            // assert we have
            expect(resultObj.status).to.equal('error');
            expect(resultObj.message).to.equal('Hello World');
            expect(resultObj.code).to.equal('HELLO_WORLD');
            done();
        });
    });

    test('jsend success response when object is sent', done => {
        let packet  = {
            test: 'test me',
            hello: 'world'
        };

        formatter(request, response, packet, function (error, result) {

            expect(typeof result).to.equal('string');

            // attempt to parse the string as json
            let resultObj = JSON.parse(result);

            expect(resultObj.status).to.equal('success');
            expect(resultObj.data.test).to.equal('test me');
            expect(resultObj.data.hello).to.equal('world');
            done();
        });
    });

    test('returns data when used by Restify 3', done => {

        let packet  = {
            test: 'test me',
            hello: 'world'
        };

        let result = formatter(request, response, packet);

        expect(typeof result).to.equal('string');

        // attempt to parse the string as json
        let resultObj = JSON.parse(result);

        expect(resultObj.status).to.equal('success');
        expect(resultObj.data.test).to.equal('test me');
        expect(resultObj.data.hello).to.equal('world');
        done();
    });


    test(
        'jsend error response returned when error is sent with default error message',
        done => {

            let HelloWorldError = createError('HelloWorldError', { code: 'HELLO_WORLD', defaultMessage: 'Default error' });
           
            formatter(request, response, new HelloWorldError(), function (error, result) {
                expect(typeof result).to.equal('string');

                // attempt to parse the string as json
                let resultObj = JSON.parse(result);

                // assert we have
                expect(resultObj.status).to.equal('error');
                expect(resultObj.message).to.equal('Default error');
                expect(resultObj.code).to.equal('HELLO_WORLD');
                done();
            });
        }
    );
});
