const { Signale } = require('signale')

module.exports = new Signale({
  displayDate: true,
  displayTimestamp: true,
  disabled: process.env.NODE_ENV === 'test',
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
