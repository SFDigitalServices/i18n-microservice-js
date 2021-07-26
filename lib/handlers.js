const log = require('./log')

module.exports = {
  asyncJsonHandler,
  cors,
  publicVersionedJson,
  versioned,
  isCacheError,
  mergeRequestParams
}

function publicVersionedJson (handler) {
  return cors(versioned(asyncJsonHandler(handler)))
}

function cors (fn) {
  return (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another option
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }
    return fn(req, res)
  }
}

function asyncJsonHandler (fn) {
  return async (req, res) => {
    try {
      const { status = 'success', ...data } = await fn(req, res)
      res.status(200).json({ status, data })
    } catch (error) {
      log.error(error)
      const { status = 'error', data = {} } = error
      res.status(200).json({ status, data })
    }
  }
}

function versioned (fn) {
  return (req, res) => {
    if (req.query.version) {
      res.setHeader('Cache-Control', 'max-age=31536000, immutable')
    }
    return fn(req, res)
  }
}

function isCacheError (req, res, { body }) {
  try {
    const parsed = JSON.parse(body)
    if (parsed.status !== 'success') {
      return true
    }
  } catch (error) {
    log.warn('unable to parse body as JSON:', body)
    return true
  }
  return false
}

function mergeRequestParams (req, res, next) {
  Object.assign(res.locals, req.params, req.query)
  next()
}
