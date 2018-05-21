'use strict';

let expect = require('chai').expect;
let utils = require('app/utils');

describe('Utils', () => {

    describe('.resolveRouteName', () => {

        test('Should return a properly formatted route name', done => {

            let mockedRoute = {
                path: '_https://upload.wikimedia.org/wikipedia/commons/3/36/Hopetoun_falls.jpg.'
            };

            let routeName = utils.resolveRouteName(mockedRoute);
            let expected = 'https__upload.wikimedia.org_wikipedia_commons_3_36_Hopetoun_falls.jpg';

            expect(routeName).to.equal(expected);
            done();
        });

        test('Should return "no_route" if no path was specified', done => {
            let routeName = utils.resolveRouteName({});
            expect(routeName).to.equal('no_route');
            done();
        });

    });

});
