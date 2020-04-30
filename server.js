const app = require('./lib/app')
const { bold } = require('chalk')
const log = require('./lib/log')

require('dotenv').config()

const {
  HOST = '0.0.0.0',
  PORT = '8001',
  GOOGLE_API_KEY
} = process.env

const server = app({
  google: GOOGLE_API_KEY ? { apiKey: GOOGLE_API_KEY } : null
})

server.listen(PORT, () => {
  log.info('i18n microservice running at: %s', bold(`${HOST}:${PORT}`))
})
