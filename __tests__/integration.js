const supertest = require('supertest')

const app = require('../server')

describe('app URL tests', () => {
  describe('phrase', () => {
    const PROJECT_ID = 'ff36e9439ea05e3d16ccbd254125135f'
    const VERSION = '1.0.0'
    const canonicalURL = `/api/phrase?projectId=${PROJECT_ID}&version=${VERSION}`
    const translations = expect.objectContaining({
      en: expect.objectContaining({
        cancel: 'Cancel'
      })
    })

    it('serves up known Phrase translations from /api/phrase?{projectId,version}', () => {
      return supertest(app)
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

    it('redirects from /phrase/:projectId@:version', () => {
      return supertest(app)
        .get(`/phrase/${PROJECT_ID}@${VERSION}`)
        .expect(302)
        .expect('location', canonicalURL)
    })
  })

  describe('google sheets', () => {
    const GOOGLE_SHEET_ID = '1hb5bC01hS7SRW8Wc7woYY7uji_M0CWTlLWtqyNiziSQ'
    const VERSION = '1.0.0'
    const canonicalURL = `/api/google?sheetId=${GOOGLE_SHEET_ID}&version=${VERSION}`

    it('serves up known Google Sheets translations', () => {
      jest.setTimeout(15000)

      return supertest(app)
        .get(canonicalURL)
        .expect(200)
        .expect('content-type', /json/)
        .then(({ body }) => {
          expect(body).toEqual({
            status: 'success',
            data: expect.objectContaining({
              en: expect.objectContaining({
                'page0.title': "Apply for help paying for your storefront's COVID-19 safety measures"
              })
            })
          })
        })
    })

    it('redirects to the canonical URL from /google/:sheetId@:version', () => {
      return supertest(app)
        .get(`/google/${GOOGLE_SHEET_ID}@${VERSION}`)
        .expect(302)
        .expect('location', canonicalURL)
    })
  })
})
