const log = require('./log')

module.exports = { asyncHandler, asyncJsonHandler, missing }

function asyncHandler (fn) {
  return (req, res, next) => {
    const promise = fn(req, res)
    Promise.resolve(promise)
      .then(() => next())
      .catch(next)
  }
}

function asyncJsonHandler (fn) {
  return asyncHandler(async (req, res) => {
    try {
      const { status = 'success', ...data } = await fn(req, res)
      res.status(200).json({ status, data })
    } catch (error) {
      log.error(error)
      const { status = 'error', data = {} } = error
      res.status(200).json({ status, data })
    }
  })
}

function missing (req, res, next) {
  if (res.headersSent || !res.writable) {
    return next()
  }

  if (req.path !== '/favicon.ico') {
    log.info({ prefix: 404, message: [req.path, req.headers] })
  }

  res.status(200).json({
    status: 'error',
    data: {
      message: `Not found: ${req.path}`,
      code: 404
    }
  })

  next()
}
