/* eslint-env jest */
class InMemoryCache {
  constructor () {
    this.cache = new Map()
    this.get = jest.fn((key, cb) => cb(null, this.cache.get(key)))
    this.set = jest.fn((key, value, options, cb) => {
      this.cache.set(key, value)
      cb()
    })
  }

  flush () {
    this.cache = new Map()
  }
}

module.exports = {
  InMemoryCache
}
