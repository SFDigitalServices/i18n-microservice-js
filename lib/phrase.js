const fetch = require('node-fetch')
const cache = require('./cache')
const cors = require('cors')
const log = require('./log').scope('phrase')
const { Router } = require('express')
const { Configuration, ProjectsApi, TranslationsApi } = require('phrase-js')
const { asyncJsonHandler, isCacheError, localize } = require('./handlers')
const { success, debug, warn } = require('./log').scope('phrase')

const EXPIRES_NEVER = 4294967295

const {
  PHRASE_ACCESS_TOKEN,
  PHRASE_ORG_SLUG = 'city-county-of-san-francisco'
} = process.env

if (!PHRASE_ACCESS_TOKEN) {
  log.error('PHRASE_ACCESS_TOKEN is not set!')
}

if (!global.FormData) {
  // Phrase needs this because it thinks it's running in a browser
  global.FormData = require('formdata-node')
}

const config = new Configuration({
  apiKey: `token ${PHRASE_ACCESS_TOKEN}`,
  fetchApi: fetch
})

module.exports = Router()
  .use('/', localize(req => req.query))
  .use('/:projectId', localize(req => req.params))
  .get('/:projectId/link', projectLink)
  .use('/:projectId@:version', localize(req => req.params))
  .use(
    cors(),
    cache({
      logger: require('./log').scope('cache'),
      isError: isCacheError,
      getCacheKey (req, res) {
        const { projectId, version } = res.locals
        return version ? `phrase:${projectId}@${version}` : null
      },
      getCacheExpires (req, res, { key }) {
        return key ? EXPIRES_NEVER : null
      }
    })
  )
  .get('*', asyncJsonHandler((req, res) => {
    return loadTranslations(res.locals)
  }))

function loadTranslations ({ projectId, ...rest }) {
  if (!projectId) {
    throw new Error(`Expected projectId, but got ${JSON.stringify(rest)}`)
  }

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
      // eslint-disable-next-line promise/no-callback-in-promise
      return next()
    } else {
      return results
    }
  })
  debug('paginating:', initialParams, '=>', params)
  return next()
}

async function projectLink (req, res) {
  const id = req.params.projectId
  const api = new ProjectsApi(config)
  const project = await api.projectShow({ id })
    .catch(error => {
      log.error('unable to load Phrase project "%s":', id, error)
      return null
    })
  if (project) {
    const url = `https://app.phrase.com/accounts/${PHRASE_ORG_SLUG}/projects/${project.slug}/dashboard`
    return res.redirect(url)
  } else {
    return res.status(404).send('No such project')
  }
}
