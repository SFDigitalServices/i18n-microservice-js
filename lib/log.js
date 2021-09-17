const { Signale } = require('signale')
const { NODE_ENV } = process.env

module.exports = new Signale({
  displayDate: true,
  displayTimestamp: true,
  // disable logging entirely in tests
  disabled: NODE_ENV === 'test',
  // don't log all messages in production
  logLevel: NODE_ENV === 'production' ? 'warn' : 'info',
  types: {
    debug: {
      badge: '·',
      color: 'yellow'
    },
    pending: {
      badge: '⋯'
    }
  }
})
