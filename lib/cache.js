const NodeCache = require('node-cache')
const log = require('./log').scope('cache')

const SECOND = 1
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const YEAR = 356 * DAY
const DEFAULT_TTL = YEAR

const cache = new NodeCache({
  useClones: false
})

module.exports = {
  cache,
  getOrSet,
  DEFAULT_TTL,
  // export time constants so that they can be used a la:
  // import { getOrSet, HOUR } from '../cache'
  // getOrSet(..., HOUR * 12)
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  YEAR
}

async function getOrSet (query, load, ttl = DEFAULT_TTL) {
  const key = (typeof query === 'string') ? query : JSON.stringify(query)
  if (cache.has(key)) {
    const data = cache.get(key)
    log.success({ prefix: 'hit', message: ['%s (expires: %d)', key, cache.getTtl(key)] })
    return data
  } else {
    log.pending({ prefix: 'miss', message: key })
    const timer = log.scope('load')
    timer.time(key)
    const data = await load(query)
    timer.timeEnd(key)
    cache.set(key, data, ttl)
    log.success({ prefix: 'set', message: key })
    return data
  }
}
