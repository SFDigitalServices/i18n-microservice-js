const { server } = require('../lib/test-helpers')

describe('/phrase/:projectId', () => {
  it('returns JSON for a known project ID', () => {
    return server.get('/phrase/ff36e9439ea05e3d16ccbd254125135f')
      .then(res => {
        expect(res.status).toBe(200)
        expect(res.body.status).toBe('success')
      })
  })

  xit('responds with 404 for a bad project ID', () => {
    return server.get('/phrase/blah')
      .then(res => {
        expect(res.status).toBe(404)
        expect(res.body.status).toBe('failure')
      })
  })
})
