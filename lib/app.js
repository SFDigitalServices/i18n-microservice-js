const express = require('express')
const cors = require('cors')
const google = require('./google')
const { missing } = require('./handlers')

module.exports = (config = {}) => {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  if (config.google) {
    app.use('/google', google(config.google))
  }

  app.use(missing)

  return app
}
