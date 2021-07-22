const cache = require('express-memjs-cache')
const logger = require('./log').scope('cache')

module.exports = (options = {}) => cache({
  logger,
  ...options
})
