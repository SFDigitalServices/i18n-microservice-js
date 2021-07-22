const fetch = require('node-fetch')
const cache = require('./cache')
const { Router } = require('express')
const { Configuration, TranslationsApi } = require('phrase-js')
const { publicVersionedJson } = require('./handlers')
const { success, debug, warn } = require('./log').scope('phrase')

const { PHRASE_ACCESS_TOKEN } = process.env
const config = new Configuration({
  apiKey: `token ${PHRASE_ACCESS_TOKEN}`,
  fetchApi: fetch
})

// Phrase needs this because it thinks it's running in a browser
global.FormData = require('formdata-node')

module.exports = Router()
  .use(cache({
    logger: require('./log').scope('cache'),
    getCacheKey (req, res) {
      const { projectId, version } = { ...req.params, ...req.query }
      debug('key:', { projectId, version })
      return version ? `phrase:${projectId}@${version}` : null
    }
  }))
  .get('/', publicVersionedJson((req, res) => {
    return loadTranslations(req.query.projectId)
  }))

function loadTranslations (projectId) {
  const api = new TranslationsApi(config)

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
