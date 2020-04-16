module.exports = { asyncHandler, asyncJsonHandler }

function asyncHandler (fn) {
  return (req, res, next) => {
    const promise = fn(req, res)
    Promise.resolve(promise)
      .then(body => next())
      .catch(next)
  }
}

function asyncJsonHandler (fn) {
  return asyncHandler(async (req, res) => {
    let data
    try {
      data = await fn(req, res)
      res.json({
        status: data.status || 'success',
        data
      })
    } catch (error) {
      res.status(error.status || 200).json({
        status: 'error',
        data: error.data || error
      })
    }
  })
}
