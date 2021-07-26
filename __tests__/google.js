/* eslint-env jest */
const express = require('express')
const supertest = require('supertest')
const memjsCacheMiddleware = require('express-memjs-cache')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const cache = require('../lib/cache')
const { InMemoryCache } = require('../lib/test-utils')

jest.mock('google-spreadsheet')
jest.mock('../lib/cache')

const hash = Date.now().toString(16)
InMemoryCache.mock(cache, memjsCacheMiddleware)

const google = require('../lib/google')

describe('Google Sheets API', () => {
  const translations = {
    en: {
      string123: 'String #123'
    }
  }

  const app = express().use(google)
  const server = supertest(app)
  const useApiKey = jest.fn().mockName('useApiKey')
  const loadInfo = jest.fn().mockName('loadInfo')

  GoogleSpreadsheet.mockImplementation(() => ({
    useApiKey,
    loadInfo,
    sheetsByIndex: {
      1: {
        title: 'My sheet',
        sheetId: 'whatever',
        getRows: jest.fn(() => [
          { key: 'string123', en: 'String #123' }
        ]),
        headerValues: ['key', 'en']
      }
    }
  }))

  afterEach(() => {
    GoogleSpreadsheet.mockClear()
    useApiKey.mockClear()
    loadInfo.mockClear()
  })

  it('?sheetId fetches a sheet', () => {
    return server
      .get('/?sheetId=1')
      .expect('content-type', /json/)
      .then(({ body }) => {
        expect(GoogleSpreadsheet).toBeCalledWith('1')
        expect(useApiKey).toBeCalled()
        expect(loadInfo).toBeCalled()
        expect(body.data).toEqual(translations)
      })
  })

  it('/:sheetId@:version fetches a sheet', () => {
    return server
      .get(`/2@${hash}`)
      .expect('content-type', /json/)
      .expect('x-cache-key', `google:2@${hash}`)
      .expect('x-cache-status', 'MISS')
      .then(({ body }) => {
        expect(body.status).toBe('success')
        expect(GoogleSpreadsheet).toBeCalledWith('2')
        expect(body.data).toEqual(translations)
      })
  })

  it('?{sheetId,version} fetches a sheet + caches', async () => {
    const url = `?sheetId=3&version=${hash}`
    const shortURL = `/3@${hash}`
    const cacheKey = `google:3@${hash}`

    await server
      .get(url)
      .expect('content-type', /json/)
      .expect('x-cache-key', cacheKey)
      .expect('x-cache-status', 'MISS')
      .then(({ body }) => {
        expect(GoogleSpreadsheet).toBeCalledWith('3')
        expect(useApiKey).toBeCalled()
        expect(loadInfo).toBeCalled()
        expect(body.data).toEqual(translations)
      })

    const hitOrMiss = process.env.CI ? /^(HIT|MISS)$/ : 'HIT'
    await server
      .get(url)
      .expect('content-type', /json/)
      .expect('x-cache-key', cacheKey)
      .expect('x-cache-status', hitOrMiss)
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })

    await server
      .get(shortURL)
      .expect('content-type', /json/)
      .expect('x-cache-key', cacheKey)
      .expect('x-cache-status', hitOrMiss)
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })
  })
})
