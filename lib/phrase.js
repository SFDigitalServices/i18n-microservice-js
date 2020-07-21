const express = require('express')
const fetch = require('node-fetch')
const { Configuration, TranslationsApi } = require('phrase-js')
const cache = require('./cache')
const { asyncJsonHandler } = require('./handlers')
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
    const query = { projectId }

    debug('loading translations:', query)

    return paginate(query, params => api.translationsList(params))
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
      .catch(error => {
        warn('failed to load translations:', error)
      })
  }
}

function paginate (initialParams, request) {
  const { perPage = 100, ...rest } = initialParams
  const params = { page: 1, perPage, ...rest }
  const results = []
  const next = () => request(params).then(result => {
    results.push(...result)
    debug('page %d: %d results (%d total)', params.page, result.length, results.length)
    if (result.length === perPage) {
      debug('loading next page...')
      params.page++
      return next()
    } else {
      return results
    }
  })
  debug('paginating:', initialParams, '=>', params)
  return next()
}
