require('dotenv').config({ path: '.env' })
const express = require('express')
// const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const https = require('https')
const http = require('http')
const fs = require('fs')
const io = require('socket.io')()
// const ioRedis = require('socket.io-redis')
const sticky = require('sticky-session')

const Signaling = require('./signaling')
// const { redisClient } = require('./helpers/redis')

let server = null
const app = express()
app.use(cors())
// app.use(bodyParser.urlencoded({ extended: false }))
// app.use(bodyParser.json())
app.use('/static', express.static(path.join(__dirname, './static')))

// const redisAdapter = ioRedis({
//   host: process.env.REDIS_HOST || 'localhost',
//   port: process.env.REDIS_PORT || 6379,
// })

if (process.env.ENABLE_SSL === false) {
  const credentials = {
    key: fs.readFileSync(process.env.CERT_PATH + '/privkey.pem', 'utf8'),
    cert: fs.readFileSync(process.env.CERT_PATH + '/cert.pem', 'utf8'),
    ca: fs.readFileSync(process.env.CERT_PATH + '/fullchain.pem', 'utf8')
  }
  server = https.createServer(credentials, app)
} else {
  server = http.createServer(app)
}

if (!sticky.listen(server, process.env.SOCKET_PORT)) {
  // Master code
  io.attach(server)
  io.set('origins', '*:*')
  // io.adapter(redisAdapter)
  server.once('listening', function () {
    console.log('Socket server started on port ' + process.env.SOCKET_PORT);
  })
  // redisClient.on("error", error => {
  //   console.error('Can`t connect to Redis: ' + error)
  // })
  // redisClient.on("connect", message => {
  //   console.error('Connected to Redis')
  // })
} else {
  // Worker code
  io.listen(server, { 'pingInterval': 500, 'timeout': 2000 });
  io.sockets.on('connection', socket => {
    Signaling(io, socket)
  });
}