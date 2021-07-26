/* eslint-env jest */
class InMemoryCache {
  static mock (cacheMock, actualCache) {
    const client = new InMemoryCache()
    cacheMock.mockImplementation((options = {}) => {
      return actualCache({ ...options, client })
    })
    return client
  }

  constructor () {
    this.cache = new Map()
    this.get = jest.fn((key, cb) => {
      cb(null, this.cache.get(key))
    }).mockName('get')
    this.set = jest.fn((key, value, options, cb) => {
      this.cache.set(key, value)
      cb()
    }).mockName('set')
  }

  flush () {
    this.cache = new Map()
  }
}

module.exports = {
  InMemoryCache
}
