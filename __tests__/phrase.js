const express = require('express')
const supertest = require('supertest')
const memjsCacheMiddleware = require('express-memjs-cache')
const cache = require('../lib/cache')
const { Configuration, TranslationsApi } = require('phrase-js')

jest.mock('phrase-js')
jest.mock('memjs')
jest.mock('../lib/cache')

const translationsList = jest.fn(() => Promise.resolve([]))

TranslationsApi.mockImplementation(() => ({
  translationsList
}))

class InMemoryCache {
  constructor () {
    this.cache = new Map()
    this.get = jest.fn((key, cb) => cb(null, this.cache.get(key)))
    this.set = jest.fn((key, value, options, cb) => {
      this.cache.set(key, value)
      cb()
    })
  }
}

cache.mockImplementation((options = {}) => memjsCacheMiddleware({
  ...options,
  client: new InMemoryCache()
}))

const phrase = require('../lib/phrase')

describe('Phrase API', () => {
  it('?projectId fetches a project', () => {
    translationsList.mockImplementationOnce(() => Promise.resolve([
      {
        key: { name: 'string123' },
        locale: { code: 'en' },
        content: 'String #123'
      }
    ]))

    const app = express().use(phrase)
    return supertest(app)
      .get('?projectId=123')
      .expect('content-type', /json/)
      .then(({ body }) => {
        expect(body.data).toEqual({
          en: {
            string123: 'String #123'
          }
        })
      })
  })

  it('?{projectId,version} fetches a project + caches', async () => {
    translationsList.mockImplementationOnce(() => Promise.resolve([
      {
        key: { name: 'string123' },
        locale: { code: 'en' },
        content: 'String #123'
      }
    ]))

    const url = '?projectId=123&version=1.0.0'

    const app = express().use(phrase)

    await supertest(app)
      .get(url)
      .expect('content-type', /json/)
      .expect('x-cache-status', 'MISS')
      .then(({ body }) => {
        expect(body.data).toEqual({
          en: {
            string123: 'String #123'
          }
        })
      })

    await supertest(app)
      .get(url)
      .expect('content-type', /json/)
      .expect('x-cache-status', 'HIT')
      .then(({ body }) => {
        expect(body.data).toEqual({
          en: {
            string123: 'String #123'
          }
        })
      })
  })
})
