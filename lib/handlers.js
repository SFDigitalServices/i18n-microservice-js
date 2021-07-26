const log = require('./log')

module.exports = {
  asyncJsonHandler,
  cors,
  isCacheError,
  mergeRequestParams
}

function cors (req, res, next) {
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
  }
  next()
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
