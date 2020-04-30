/* eslint-env jest */
const supertest = require('supertest')
const getPort = require('get-port')
const App = require('../app')

const app = App()
const request = supertest(app)
let server
beforeAll(async () => {
  const port = await getPort({ port: 3001 })
  server = app.listen(port)
})

afterAll(() => server.close())

describe('app()', () => {
  it('does 404s correctly', async done => {
    request
      .get('/derp')
      .set('accept', 'application/json')
      .expect('content-type', /json/)
      .expect(200, done)
  })
})
