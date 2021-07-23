/* eslint-env jest */
const express = require('express')
const supertest = require('supertest')
const memjsCacheMiddleware = require('express-memjs-cache')
const cache = require('../lib/cache')
const { GoogleSpreadsheet } = require('google-spreadsheet')

jest.mock('google-spreadsheet')
jest.mock('../lib/cache')

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
    const app = express().use(google)
    return supertest(app)
      .get('/?sheetId=123')
      .expect('content-type', /json/)
      .then(({ body }) => {
        expect(useApiKey).toBeCalled()
        expect(loadInfo).toBeCalled()
        expect(body.data).toEqual(translations)
      })
  })

  it('?{projectId,version} fetches a project + caches', async () => {
    const url = '/?sheetId=456&version=1.0.0'
    const cacheKey = 'google:456@1.0.0'
    const app = express().use(google)

    await supertest(app)
      .get(url)
      .expect('content-type', /json/)
      .expect('x-cache-key', cacheKey)
      .expect('x-cache-status', 'MISS')
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })

    expect(useApiKey).toBeCalled()
    expect(loadInfo).toBeCalled()

    await supertest(app)
      .get(url)
      .expect('content-type', /json/)
      .expect('x-cache-key', cacheKey)
      .expect('x-cache-status', 'HIT')
      .then(({ body }) => {
        expect(body.data).toEqual(translations)
      })
  })
})
