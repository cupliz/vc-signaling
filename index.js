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
  console.log('HTTPS/SSL')
  server = https.createServer(credentials, app)
} else {
  console.log('HTTP')
  server = http.createServer(app)
}

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
server.listen(config.SOCKET_PORT)
server.once('listening', () => {
  console.log('Socket server started on port ' + config.SOCKET_PORT);
})

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/static', express.static(path.join(__dirname, './static')))
app.use('/.well-known/acme-challenge/', express.static(path.join(__dirname, './static')))
app.get('/v1', (req, res) => {
  res.json({ version: 200402 })
})

// Worker code
io.listen(server, { 'pingInterval': 500, 'timeout': 2000 });
io.sockets.on('connection', socket => {
  Signaling(io, socket)
});

// if (!sticky.listen(server, config.SOCKET_PORT)) {
// } else {
// }
