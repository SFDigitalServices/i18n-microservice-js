const supertest = require('supertest')

require('dotenv').config()

const { TEST_URL = 'http://localhost:3000' } = process.env

module.exports = {
  server: supertest(TEST_URL)
}
