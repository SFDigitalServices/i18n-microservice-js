const { Signale } = require('signale')

module.exports = new Signale({
  displayDate: true,
  displayTimestamp: true,
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
