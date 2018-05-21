'use strict';

let sinon = require('sinon');
let expect = require('chai').expect;
let mockery = require('mockery');

let mocks = require('__tests__/helpers/mocks');
let mockedMetrics = mocks.mockedMetrics;

// stub out date+time
let clock = sinon.useFakeTimers(new Date(2015, 1, 2, 3, 4, 5, 0).getTime());

// stub out onHeaders
mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false
});

let onHeadersMock = function (res, callback) {
    // re-stub the date+time causing a 987ms difference
    clock = sinon.useFakeTimers(new Date(2015, 1, 2, 3, 4, 5, 987).getTime());

    callback();
};

mockery.registerMock('on-headers', onHeadersMock);

let RouteStats = require('app/lib/routestats');

let resolveRoutes = function () {
    return 'fakeRouteName';
};

describe('RouteStats', () => {

    describe('constructor', () => {

        test('requires a statsD client object', () => {
            expect(function () {
                new RouteStats();
            }).to.throw(Error, 'No StatsD client provided.');
        });

        test('allows a "resolveRouteName" method to be provided', () => {
            let routestats = new RouteStats(mockedMetrics, function () {
                return 'hello world';
            });

            expect(routestats.resolveRouteName('fakeValue')).to.equal('hello world');
        });

        test(
            'uses a default "resolveRouteName" method if one is not provided',
            () => {
                let routestats = new RouteStats(mockedMetrics);
                expect(routestats.resolveRouteName({ name: 'mocked_route_name' })).to.equal('mocked_route_name');
            }
        );

        test(
            'default "resolveRouteName" method returns "unnamed" if the route does not have a name',
            () => {
                let routestats = new RouteStats(mockedMetrics);
                expect(routestats.resolveRouteName({})).to.equal('unnamed');
            }
        );

        test('does not throw an error when necessary values are given', () => {
            expect(function () {
                new RouteStats(mockedMetrics, resolveRoutes);
            }).to.not.throw(Error);
        });

        test('sets all values on to the object', () => {
            let routestats = new RouteStats(mockedMetrics, resolveRoutes);
            expect(typeof routestats.statsdClient).to.equal('object');
            expect(typeof routestats.resolveRouteName).to.equal('function');
            expect(typeof routestats.onHeaders).to.equal('function');
        });

        test('allows "keyTemplates" to be overwritten', () => {

            let newKeyTemplates = {
                routeTiming: 'testKey1',
                routeTotalCount: 'testKey2',
                fakeKey1: 'testKey3'
            };

            let expected = {
                routeTiming: newKeyTemplates.routeTiming,
                routeStatusCode: 'request.%route%.http_status.%responseCode%',
                routeTotalCount: newKeyTemplates.routeTotalCount,
                appTotalCount: 'request.total'
            };

            // with a custom route name resolver
            let routerstats = new RouteStats(mockedMetrics, resolveRoutes, newKeyTemplates);
            expect(JSON.stringify(routerstats.keyTemplates)).to.equal(JSON.stringify(expected));

            // without custom route name resolver
            routerstats = new RouteStats(mockedMetrics, undefined, newKeyTemplates);
            expect(JSON.stringify(routerstats.keyTemplates)).to.equal(JSON.stringify(expected));
        });
    });

});
