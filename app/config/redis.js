'use strict';
const { promisify } = require('util');

class RedisClient {

    get() {
        if (!RedisClient.prototype.client) {
            RedisClient.prototype.client = RedisClient.create();
        }
        return RedisClient.prototype.client;
    }

    static create() {

        let config = require('app/config/config');
        let redis = require('redis');

        var client = redis.createClient({
            host: config.redis.host,
            port: config.redis.port,
            detect_buffers: true,
            expire: 60 * 60 //One hour
        });

        client.select(config.redis.database);

        return {
            get: promisify(client.get).bind(client),
            set: promisify(client.set).bind(client),
            del: promisify(client.del).bind(client),
            hset: promisify(client.hset).bind(client),
            hgetall: promisify(client.hgetall).bind(client),
            hdel: promisify(client.hdel).bind(client),
            hkeys: promisify(client.hkeys).bind(client)
        };
    }
}

module.exports = new RedisClient().get();
