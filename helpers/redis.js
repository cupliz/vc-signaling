const redis = require("redis")
const { promisify } = require("util")
const Redlock = require('redlock');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
})
// redisClient.select(1 - (config.server.port == 8890), function () { });

module.exports = {
  redisClient,
  redlock: new Redlock([redisClient], {
    driftFactor: 0.01,
    retryCount: 50,
    retryDelay: 200,
    retryJitter: 200
  }),
  getAsync: promisify(redisClient.get).bind(redisClient),
  setAsync: promisify(redisClient.set).bind(redisClient),
  delAsync: promisify(redisClient.del).bind(redisClient),
  hgetAsync: promisify(redisClient.hget).bind(redisClient),
  hsetAsync: promisify(redisClient.hset).bind(redisClient),
  hdelAsync: promisify(redisClient.hdel).bind(redisClient),
  hgetallAsync: promisify(redisClient.hgetall).bind(redisClient),
}