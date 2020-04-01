const crypto = require('crypto')
const config = require('./config')
const knex = require('./helpers/knex')
const iceServers = [
  {
    "urls": [config.TURN_URL],
    "username": config.TURN_USER,
    "credential": config.TURN_CREDENTIAL
  },
  {
    "urls": [config.STUN_URL],
    "username": config.STUN_USER,
    "credential": config.STUN_CREDENTIAL
  }
]

const emitResult = (io, socket, cmd, result) => {
  if (result.stack) {
    const message = result.stack.split('\n')[0]
    console.log(message)
    io.to(socket.id).emit(cmd, { message })
  } else {
    io.to(socket.id).emit(cmd, result)
  }
}
const countGuestIdle = async (io) => {
  const result = await knex('calls').count('id as idle').where('status', 'open').first()
  console.log('idle guest: ', result)
  io.emit('/v1/stream/idle', result)
}
const Signaling = (io, socket) => {

  // const device = crypto.randomBytes(16).toString('hex')
  io.to(socket.id).emit('/v1/ready', { iceServers })
  
  socket.on('error', (error) => {
    emitResult(io, socket, '/v1/error', { message: error })
    console.error('Socket error:' + error, socket.handshake.address)
  })
  socket.on('connect', (e) => { 
    console.log('connect', socket.id)
  })
  socket.on('disconnect', (e) => { 
    console.log('disconnect', socket.id)
  })

  const userLogin = '/v1/user/login'
  socket.on(userLogin, ({ username, password, token }) => {
    if (username && password && password == '123456') {
      emitResult(io, socket, userLogin, { agent: username })
    } else if (token) {
      emitResult(io, socket, userLogin, { agent: username })
    }
  })

  const streamInit = '/v1/stream/init'
  socket.on(streamInit, async (data) => {
    try {
      const getStream = await knex('calls').where('status', 'open').first()
        .modify((q) => { if (data.stream) { q.where('id', data.stream) } })
      if (getStream) {
        const { id, guest, agent, company } = getStream
        await knex('calls').update({ guestSocket: socket.id }).where('id', getStream.id)
        const result = { stream: id, guest, agent, company }
        emitResult(io, socket, streamInit, result)
      } else {
        const { guest, company } = data
        const [id] = await knex('calls').insert({ guest, company, guestSocket: socket.id })
        const result = { stream: id, guest, agent: null, company }
        emitResult(io, socket, streamInit, result)
      }
      countGuestIdle(io)
    } catch (error) { emitResult(io, socket, streamInit, error) }
  })

  const streamNext = '/v1/stream/next'
  socket.on(streamNext, async () => {
    try {
      const getStream = await knex('calls').where('status', 'open').first()
      if (getStream) {
        const { id, guest, agent, company } = getStream
        emitResult(io, socket, streamNext, { stream: id, guest, agent, company })
      } else {
        emitResult(io, socket, streamNext, { message: 'stream not found' })
      }
    } catch (error) { emitResult(io, socket, streamNext, error) }
  })

  const streamOffer = '/v1/stream/offer'
  socket.on(streamOffer, async (data) => {
    const getStream = await knex('calls').where('id', data.stream).first()
    if (getStream) {
      await knex('calls').update({ agent: data.agent, agentSocket: socket.id }).where('id', getStream.id)
      io.to(getStream.guestSocket).emit(streamOffer, { agent: data.agent, sdp: data.sdp })
    }
  })

  const streamAnswer = '/v1/stream/answer'
  socket.on(streamAnswer, async (data) => {
    const getStream = await knex('calls').where('id', data.stream).first()
    if (getStream) {
      io.to(getStream.agentSocket).emit(streamAnswer, { guest: data.guest, sdp: data.sdp })
    }
  })

  const iceAgent = '/v1/ice/agent'
  socket.on(iceAgent, async (data) => {
    const getStream = await knex('calls').where('id', data.stream).first()
    if (getStream) {
      io.to(getStream.guestSocket).emit('/v1/ice/candidate', { candidate: data.candidate })
    }
  })
  const iceGuest = '/v1/ice/guest'
  socket.on(iceGuest, async (data) => {
    const getStream = await knex('calls').where('id', data.stream).first()
    if (getStream) {
      io.to(getStream.agentSocket).emit('/v1/ice/candidate', { candidate: data.candidate })
    }
  })

  const streamFinish = '/v1/stream/finish'
  socket.on(streamFinish, async (data) => {
    const getStream = await knex('calls').where('id', data.stream).first()
    if (getStream) {
      await knex('calls').update({ status: 'closed', endedBy: data.by }).where('id', data.stream)
      const result = { message: `call ended by ${data.by}` }
      io.to(getStream.agentSocket).emit(streamFinish, result)
      io.to(getStream.guestSocket).emit(streamFinish, result)
    }
  })

}

module.exports = Signaling