'use strict';

let httpMocks = require('node-mocks-http');

let mockedConfig = require('app/config/config');

let mockedLogger = {
    info: () => {
    },

    debug: () => {
    },

    warn: () => {
    },

    error: () => {
    }
};

let mockedLoggerWithOutput = {
    info: console.log,
    debug: console.log,
    warn: console.log,
    error: console.error
};

let mockedUtils = {
    resolveRouteName: () => {
    },
    base64_decode: () => {
    },
    base64_encode: () => {
    },
    generateShortId: () => {
    },
};

let mockedRouteStats = {
    record: () => {
    }
};

let mockedJwt = {
    createToken: () => {
    },

    verifyToken: () => {
    }
};

let mockedMetrics = {
    increment: () => {
    },

    gauge: () => {
    },

    timing: () => {
    },

    histogram: () => {
    }
};

let mockedReq = httpMocks.createRequest();
let mockedRes = httpMocks.createResponse();

let MockedRequestFactory = function (opts) {
    let defaultOpts = {
        session: {},
        body: {}
    };
    return httpMocks.createRequest(Object.assign({}, defaultOpts, opts));
};


let mockedModelInstance = {
    createDraft: () => {
    },
    updateDraft: () => {
    },
    getDraft: () => {
    },
    listMessages: () => {
    },
    addMessageError: () => {
    },
    listMessageErrors: () => {
    },
    updateAsSentMessage: () => {
    },
    messsagesCount: () => {
    },
    validateDraft: () => {
    },


    registerUser: () => {
    },
    getUserId: () => {
    }, getUserProfile: () => {
    },
    getUserName: () => {
    },
};

module.exports = {
    mockedUtils,
    mockedConfig,
    mockedLogger,
    mockedMetrics,
    mockedRouteStats,
    mockedJwt,
    mockedLoggerWithOutput,
    mockedReq,
    mockedRes,
    MockedRequestFactory,
    mockedModelInstance
};
