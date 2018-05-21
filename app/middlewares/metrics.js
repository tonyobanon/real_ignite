'use strict';

var getNamespace = require('continuation-local-storage').getNamespace;

const serviceLocator = require('app/lib/service_locator');
const client = serviceLocator.get('metrics');

module.exports = (err, metrics, req, res, route) => {
    
    var namespace = 'server_metrics';

    var tags = [metrics.path, metrics.method, metrics.statusCode];

    var request = getNamespace('request');
    var reqId = request && request.get('request-id') ?  request.get('request-id') : '';

    if(reqId) {
        tags.push(reqId);
    }

    client.timing(`${namespace}.total_latency`, metrics.totalLatency, tags);

    client.increment(`${namespace}.request_path.${metrics.path}`, 1, tags);

    client.gauge(`${namespace}.pending_requests`,  metrics.inflightRequests, tags);

    if(err) {
        client.increment(`${namespace}.error_count`, 1, tags);
    }
};