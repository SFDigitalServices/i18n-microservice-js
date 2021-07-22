if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const google = require('./lib/google')
const phrase = require('./lib/phrase')
const redirects = require('./lib/redirects')

const { PORT = '8001' } = process.env

const app = express()
  .use('/api/google', google)
  .use('/api/phrase', phrase)
  .use(redirects)

const server = app.listen(PORT, () => {
  const { address, port } = server.address()
  console.log('server listening at %s:%s', address === '::' ? 'localhost' : address, port)
})
