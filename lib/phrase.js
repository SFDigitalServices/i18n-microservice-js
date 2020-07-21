const express = require('express')
const { asyncJsonHandler } = require('./handlers')
const cache = require('./cache')
const fetch = require('node-fetch')
const { Configuration, TranslationsApi } = require('phrase-js')
const { success, debug, warn } = require('./log').scope('phrase')

// Phrase needs this because it thinks it's running in a browser
global.FormData = require('formdata-node')

module.exports = ({ apiKey }) => {
  const config = new Configuration({
    apiKey: `token ${apiKey}`,
    fetchApi: fetch
  })
  const api = new TranslationsApi(config)

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

  function loadTranslations (projectId, version, params) {
    const query = {
      projectId,
      perPage: 100
    }

    debug('loading translations:', query)

    return api.translationsList(query)
      .then(translations => {
        success('got %d translations!', translations.length)

        const resources = {}
        for (const translation of translations) {
          const {
            key: { name: stringId },
            locale: { code: lang },
            content
          } = translation

          if (stringId === content || !content) continue

          if (!resources[lang]) {
            resources[lang] = {}
          }
          resources[lang][stringId] = content
        }

        return resources
      })
  }
}
