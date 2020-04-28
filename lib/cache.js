const NodeCache = require('node-cache')

const DEFAULT_TTL = 60 * 60 // one hour

const cache = new NodeCache({
  useClones: false
})

module.exports = {
  cache,
  DEFAULT_TTL,
  async getOrSet (query, load, ttl = DEFAULT_TTL) {
    const key = (typeof query === 'string') ? query : JSON.stringify(query)
    if (cache.has(key)) {
      const data = cache.get(key)
      console.warn('[cache] hit  "%s" (expires: %d) data:', key, cache.getTtl(key), data)
      return data
    } else {
      console.warn('[cache] miss "%s", loading', key)
      console.time('load')
      const data = await load(query)
      console.warn('[cache] loaded:', data)
      console.timeEnd('load')
      cache.set(key, data, ttl)
      return data
    }
  }
}
