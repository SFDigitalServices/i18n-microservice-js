/* eslint-env jest */
const express = require('express')
const supertest = require('supertest')
const memjsCacheMiddleware = require('express-memjs-cache')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const cache = require('../lib/cache')
const { InMemoryCache } = require('../lib/test-utils')

jest.mock('google-spreadsheet')
jest.mock('../lib/cache')

const client = new InMemoryCache()
afterEach(() => client.flush())
cache.mockImplementation((options = {}) => memjsCacheMiddleware({
  ...options,
  client
}))

const hash = Date.now().toString(16)
const google = require('../lib/google')

describe('Google Sheets API', () => {
  const sheetsByIndex = {
    1: {
      title: 'My sheet',
      sheetId: '123',
      getRows: () => [
        { key: 'string123', en: 'String #123' }
      ],
      headerValues: ['key', 'en']
    }
  }
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
    sheetsByIndex
  }))

  afterEach(() => {
    useApiKey.mockClear()
    loadInfo.mockClear()
  })

  it('?sheetId fetches a sheet', () => {
    return server
      .get('/?sheetId=123')
      .expect('content-type', /json/)
      .then(({ body }) => {
        expect(useApiKey).toBeCalled()
        expect(loadInfo).toBeCalled()
        expect(body.data).toEqual(translations)
      })
  })

  it('?{projectId,version} fetches a project + caches', async () => {
    const url = `/?sheetId=456&version=${hash}`
    const cacheKey = `google:456@${hash}`

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
  })
})
