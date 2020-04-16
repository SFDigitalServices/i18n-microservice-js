const { join } = require('path')
const { readFileSync } = require('fs')
const express = require('express')
const google = require('./lib/google')

require('dotenv').config()

const {
  HOST = '0.0.0.0',
  PORT = '8001',
  GOOGLE_AUTH_CREDS_PATH = '.google-service-credentials.json',
  GOOGLE_AUTH_CREDS = readFileSync(join(__dirname, GOOGLE_AUTH_CREDS_PATH), 'utf8')
} = process.env

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/google', google({ credentials: JSON.parse(GOOGLE_AUTH_CREDS) }))

app.listen(PORT, () => {
  console.log(`Translation microservice running on ${HOST}:${PORT}`)
})
