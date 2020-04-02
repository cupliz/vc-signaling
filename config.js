module.exports = {
  ENABLE_SSL: process.env.ENABLE_SSL || 'false',
  CERT_PATH: process.env.CERT_PATH || './cert',
  SOCKET_PORT: process.env.SOCKET_PORT || '8890',
  REST_PORT: process.env.REST_PORT || '8850',
  STUN_URL: process.env.STUN_URL || 'stun:35.204.73.142:3478',
  STUN_USER: process.env.STUN_USER || 'app',
  STUN_CREDENTIAL: process.env.STUN_CREDENTIAL || 'b3EvAUyD3zCrq5brm2SZ7nDbx63zkdn26bSP',
  TURN_URL: process.env.TURN_URL || 'turn:35.204.73.142:3478',
  TURN_USER: process.env.TURN_USER || 'app',
  TURN_CREDENTIAL: process.env.TURN_CREDENTIAL || 'b3EvAUyD3zCrq5brm2SZ7nDbx63zkdn26bSP',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
}