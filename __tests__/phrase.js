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

InMemoryCache.mock(cache, memjsCacheMiddleware)

const phrase = require('../lib/phrase')

describe('Phrase API', () => {
  const app = express().use(phrase)
  const server = supertest(app)
  const translations = {
    en: {
      string123: 'String #123'
    }
  }

  translationsList.mockImplementation(() => Promise.resolve([
    {
      key: { name: 'string123' },
      locale: { code: 'en' },
      content: 'String #123'
    }
  ]))

  it('?projectId fetches a project', () => {
    return server
      .get('?projectId=1')
      .expect('content-type', /json/)
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })
  })

  it('/:projectId@:version fetches a project', () => {
    return server
      .get('?projectId=1')
      .expect('content-type', /json/)
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })
  })

  it('?{projectId,version} fetches a project + caches', async () => {
    const url = `?projectId=2&version=${hash}`

    await server
      .get(url)
      .expect('content-type', /json/)
      .expect('x-cache-status', 'MISS')
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })

    await server
      .get(url)
      .expect('content-type', /json/)
      .expect('x-cache-status', 'HIT')
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })

    await server
      .get(`/2@${hash}`)
      .expect('content-type', /json/)
      .expect('x-cache-status', 'HIT')
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })
  })
})
