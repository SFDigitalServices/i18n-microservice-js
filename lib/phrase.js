import fetch from 'node-fetch'
import { Configuration } from 'phrase-js'
import dotenv from 'dotenv'

dotenv.config()

const { PHRASE_ACCESS_TOKEN } = process.env

if (!PHRASE_ACCESS_TOKEN) {
  throw new Error('PHRASE_ACCESS_TOKEN is not set!')
}

if (!global.FormData) {
  // Phrase needs this because it thinks it's running in a browser
  global.FormData = require('formdata-node')
}

export const phraseConfig = new Configuration({
  apiKey: `token ${PHRASE_ACCESS_TOKEN}`,
  fetchApi: fetch
})
