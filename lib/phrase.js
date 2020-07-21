const anymatch = require('anymatch')
const express = require('express')
const { asyncJsonHandler } = require('./handlers')
const cache = require('./cache')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { success, debug, warn } = require('./log').scope('phrase')

module.exports = ({ apiKey }) => {
  const app = express()

  const handler = asyncJsonHandler(async (req, res, next) => {
    // combine the query string and path params into a single query object
    const query = Object.assign({}, req.query, req.params)
    return getTranslations(query)
  })

  app.get('/:projectId/:version', handler)
  app.get('/:projectId', handler)

  return app

  async function getTranslations (params) {
    const { projectId, version = Date.now(), ...rest } = params
    return getCachedTranslations(projectId, version, rest)
  }

  async function getCachedTranslations (projectId, version, rest) {
    const key = `phrase:${projectId}@${version}`
    return cache.getOrSet(key, () => loadTranslations(projectId, version, rest))
  }

  async function loadTranslations (projectId, version, params) {
    return { projectId, version }
  }
}
