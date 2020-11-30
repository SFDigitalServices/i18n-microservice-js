import { phraseConfig } from '../lib/phrase'
import { TranslationsApi } from 'phrase-js'
import { publicVersionedJson } from '../lib/handlers'

const { success, debug, warn } = require('../lib/log').scope('phrase')

const api = new TranslationsApi(phraseConfig)

module.exports = publicVersionedJson((req, res) => {
  return getTranslations(req.query)
})

async function getTranslations (params) {
  const { projectId, version = Date.now(), ...rest } = params
  return loadTranslations(projectId, version, rest)
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
