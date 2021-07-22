const express = require('express')
const supertest = require('supertest')
const memjsCacheMiddleware = require('express-memjs-cache')
const cache = require('../lib/cache')
const { GoogleSpreadsheet } = require('google-spreadsheet')

jest.mock('google-spreadsheet')
jest.mock('memjs')
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
  it('?sheetId fetches a sheet', () => {
    GoogleSpreadsheet.mockImplementationOnce(() => ({
      useApiKey: jest.fn(),
      loadInfo: jest.fn(),
      sheetsByIndex: {
        1: {
          title: 'My sheet',
          sheetId: '123',
          getRows: () => [
            {key: 'string123', en: 'String #123'}
          ],
          headerValues: ['key', 'en']
        }
      }
    }))

    const app = express().use(google)
    return supertest(app)
      .get('?sheetId=123')
      .expect('content-type', /json/)
      .then(({ body }) => {
        expect(body.data).toEqual({
          en: {
            string123: 'String #123'
          }
        })
      })
  })

  it.skip('?{projectId,version} fetches a project + caches', async () => {
    GoogleSpreadsheet.mockImplementationOnce(() => ({
      useApiKey: jest.fn(),
      loadInfo: jest.fn(),
      sheetsByIndex: {
        1: {
          title: 'My sheet',
          sheetId: '123',
          getRows: () => [
            {key: 'string123', en: 'String #123'}
          ],
          headerValues: ['key', 'en']
        }
      }
    }))

    const url = '?sheetId=456&version=1.0.0'
    const app = express().use(google)

    await supertest(app)
      .get(url)
      .expect('content-type', /json/)
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
