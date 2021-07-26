const log = require('./log')

module.exports = {
  asyncJsonHandler,
  isCacheError,
  localize
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

function localize (getParams) {
  return (req, res, next) => {
    const params = getParams(req, res)
    Object.assign(res.locals, params)
    next()
  }
}
