const express = require('express')
const cors = require('cors')
const { bold } = require('chalk')
const google = require('./lib/google')
const log = require('./lib/log')

require('dotenv').config()

const {
  HOST = '0.0.0.0',
  PORT = '8001',
  GOOGLE_API_KEY
} = process.env

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/google', google({ apiKey: GOOGLE_API_KEY }))

app.listen(PORT, () => {
  log.info('i18n microservice running at: %s', bold(`${HOST}:${PORT}`))
})
