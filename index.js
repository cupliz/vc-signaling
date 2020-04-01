require('dotenv').config({ path: '.env' })
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const https = require('https')
const http = require('http')
const fs = require('fs')
const io = require('socket.io')()
// const ioRedis = require('socket.io-redis')
const sticky = require('sticky-session')
const config = require('./config')
const Signaling = require('./signaling')
// const { redisClient } = require('./helpers/redis')

let server = null
const app = express()
// const redisAdapter = ioRedis({
//   host: config.REDIS_HOST,
//   port: config.REDIS_PORT,
// })
if (config.ENABLE_SSL) {
  const credentials = {
    key: fs.readFileSync(config.CERT_PATH + '/privkey.pem', 'utf8'),
    cert: fs.readFileSync(config.CERT_PATH + '/cert.pem', 'utf8'),
    ca: fs.readFileSync(config.CERT_PATH + '/fullchain.pem', 'utf8')
  }
  server = https.createServer(credentials, app)
} else {
  server = http.createServer(app)
}

if (!sticky.listen(server, config.SOCKET_PORT)) {
  // Master code
  io.attach(server)
  io.set('origins', '*:*')
  // io.adapter(redisAdapter)
  // redisClient.on("error", error => {
  //   console.error('Can`t connect to Redis: ' + error)
  // })
  // redisClient.on("connect", message => {
  //   console.error('Connected to Redis')
  // })
  server.once('listening', () => {
    console.log('Socket server started on port ' + config.SOCKET_PORT);
  })
  server.listen(config.REST_PORT)
  console.log('Rest server started at ' + config.REST_PORT + ' port');

  app.use(cors())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use('/static', express.static(path.join(__dirname, './static')))
  app.get('/v1', (req, res) => {
    res.json({ version: 200402 })
  })
} else {
  // Worker code
  io.listen(server, { 'pingInterval': 500, 'timeout': 2000 });
  io.sockets.on('connection', socket => {
    Signaling(io, socket)
  });
}
