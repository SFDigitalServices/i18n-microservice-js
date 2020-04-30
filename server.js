const { join } = require('path')
const { readFileSync } = require('fs')
const express = require('express')
const google = require('./lib/google')
const cors = require('cors')

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
  console.log(`Translation microservice running on ${HOST}:${PORT}`)
})
