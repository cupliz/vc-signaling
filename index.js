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
// const { redisClient } = require('./helpers/redis')
const sticky = require('sticky-session')
const config = require('./config')
const Signaling = require('./signaling')

let server = null
const app = express()

if (config.ENABLE_SSL === 'true') {
  const credentials = {
    key: fs.readFileSync(config.CERT_PATH + '/privkey.pem', 'utf8'),
    cert: fs.readFileSync(config.CERT_PATH + '/cert.pem', 'utf8'),
    ca: fs.readFileSync(config.CERT_PATH + '/fullchain.pem', 'utf8')
  }
  // console.log('HTTPS/SSL')
  server = https.createServer(credentials, app)
} else {
  // console.log('HTTP')
  server = http.createServer(app)
}

if (!sticky.listen(server, config.SOCKET_PORT)) {
  // Master code
  server.once('listening',()=>{
    console.log('Server started on port ' + config.SOCKET_PORT);
  })
  // const redisAdapter = ioRedis({
  //   host: config.REDIS_HOST,
  //   port: config.REDIS_PORT,
  // })
  // io.adapter(redisAdapter)
  // redisClient.on("error", error => {
  //   console.error('Can`t connect to Redis: ' + error)
  // })
  // redisClient.on("connect", message => {
  //   console.error('Connected to Redis')
  // })
} else {
  // Worker code
  app.use(cors())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use('/static', express.static(path.join(__dirname, './static')))
  app.use('/.well-known/acme-challenge/', express.static(path.join(__dirname, './static')))
  app.get('/', (req, res) => {
    res.json({ version: 200402 })
  })
  io.set('origins', '*:*')
  io.listen(server, { 'pingInterval': 500, 'timeout': 2000 });
  io.sockets.on('connection', socket => {
    Signaling(io, socket)
  });
}
