/* eslint-env jest */
const express = require('express')
const supertest = require('supertest')
const memjsCacheMiddleware = require('express-memjs-cache')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const cache = require('../lib/cache')
const { InMemoryCache } = require('../lib/test-utils')

jest.mock('google-spreadsheet')
jest.mock('../lib/cache')

const client = InMemoryCache.mock(cache, memjsCacheMiddleware)
afterEach(() => {
  client.flush()
})

const hash = Date.now().toString(16)
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
      .get('/?sheetId=123')
      .expect('content-type', /json/)
      .then(({ body }) => {
        expect(GoogleSpreadsheet).toBeCalledWith('123')
        expect(useApiKey).toBeCalled()
        expect(loadInfo).toBeCalled()
        expect(body.data).toEqual(translations)
      })
  })

  it('/:sheetId@:version fetches a sheet', () => {
    return server
      .get(`/999@${hash}`)
      .expect('content-type', /json/)
      .expect('x-cache-key', `google:999@${hash}`)
      .expect('x-cache-status', 'MISS')
      .then(({ body }) => {
        expect(body.status).toBe('success')
        expect(GoogleSpreadsheet).toBeCalledWith('999')
        expect(body.data).toEqual(translations)
      })
  })

  it('?{sheetId,version} fetches a sheet + caches', async () => {
    const url = `/?sheetId=666&version=${hash}`
    const cacheKey = `google:666@${hash}`

    await server
      .get(url)
      .expect('content-type', /json/)
      .expect('x-cache-key', cacheKey)
      .expect('x-cache-status', 'MISS')
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })

    expect(useApiKey).toBeCalled()
    expect(loadInfo).toBeCalled()

    await server
      .get(url)
      .expect('content-type', /json/)
      .expect('x-cache-key', cacheKey)
      .expect('x-cache-status', 'HIT')
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })

    await server
      .get(`/666@${hash}`)
      .expect('content-type', /json/)
      .expect('x-cache-key', cacheKey)
      .expect('x-cache-status', 'HIT')
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })
  })
})
