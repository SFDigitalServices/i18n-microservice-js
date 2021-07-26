/* eslint-env jest */
const express = require('express')
const supertest = require('supertest')
const memjsCacheMiddleware = require('express-memjs-cache')
const { TranslationsApi } = require('phrase-js')
const cache = require('../lib/cache')
const { InMemoryCache } = require('../lib/test-utils')

jest.mock('phrase-js')
jest.mock('../lib/cache')

const hash = Date.now().toString(16)
const translationsList = jest.fn(() => Promise.resolve([]))

TranslationsApi.mockImplementation(() => ({
  translationsList
}))

const client = new InMemoryCache()
afterEach(() => client.flush())
cache.mockImplementation((options = {}) => memjsCacheMiddleware({
  ...options,
  client
}))

const phrase = require('../lib/phrase')

describe('Phrase API', () => {
  const app = express().use(phrase)
  const server = supertest(app)

  it('?projectId fetches a project', () => {
    translationsList.mockImplementationOnce(() => Promise.resolve([
      {
        key: { name: 'string123' },
        locale: { code: 'en' },
        content: 'String #123'
      }
    ]))

    return server
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

    const url = `?projectId=123&version=${hash}`

    await server
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

    await server
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
