/* eslint-env jest */
const supertest = require('supertest')
const app = require('../server')

const server = supertest(app)
const hash = Date.now().toString(16)

describe('app URL tests', () => {
  describe('phrase', () => {
    const PROJECT_ID = 'ff36e9439ea05e3d16ccbd254125135f'
    const VERSION = `0.0.0-${hash}`
    const canonicalURL = `/api/phrase?projectId=${PROJECT_ID}&version=${VERSION}`
    const translations = expect.objectContaining({
      en: expect.objectContaining({
        cancel: 'Cancel'
      })
    })

    it('serves up known Phrase translations from /api/phrase?{projectId,version}', () => {
      return server
        .get(canonicalURL)
        .expect(200)
        .expect('content-type', /json/)
        .then(({ body }) => {
          expect(body).toEqual({
            status: 'success',
            data: translations
          })
        })
    })

    it('works via /phrase/:projectId@:version', () => {
      return server
        .get(`/phrase/${PROJECT_ID}@${VERSION}`)
        .expect(200)
        .expect('content-type', /json/)
        .then(({ body }) => {
          expect(body).toEqual({
            status: 'success',
            data: translations
          })
        })
    })
  })

  describe('google sheets', () => {
    const GOOGLE_SHEET_ID = '1hb5bC01hS7SRW8Wc7woYY7uji_M0CWTlLWtqyNiziSQ'
    const VERSION = `0.0.0-${hash}`
    const canonicalURL = `/api/google?sheetId=${GOOGLE_SHEET_ID}&version=${VERSION}`
    const translations = expect.objectContaining({
      en: expect.objectContaining({
        'page0.title': "Apply for help paying for your storefront's COVID-19 safety measures"
      })
    })

    it('serves up known Google Sheets translations', () => {
      jest.setTimeout(15000)

      return server
        .get(canonicalURL)
        .expect(200)
        .expect('content-type', /json/)
        .then(({ body }) => {
          expect(body).toEqual({
            status: 'success',
            data: translations
          })
        })
    })

    it('works via /google/:sheetId@:version', () => {
      return server
        .get(`/google/${GOOGLE_SHEET_ID}@${VERSION}`)
        .expect(200)
        .expect('content-type', /json/)
        .then(({ body }) => {
          expect(body).toEqual({
            status: 'success',
            data: translations
          })
        })
    })
  })
})
