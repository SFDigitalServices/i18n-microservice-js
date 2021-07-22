const urlTemplate = require('url-template')
const { Router } = require('express')

module.exports = Router()
  .get('/google/:sheetId@:version', redirect('/api/google{?sheetId,version}'))
  .get('/google/:sheetId', redirect('/google{?sheetId}'))
  .get('/phrase/:projectId@:version', redirect('/api/phrase{?projectId,version}'))
  .get('/phrase/:projectId', redirect('/api/phrase{?projectId}'))

function redirect (url) {
  const template = urlTemplate.parse(url)
  return (req, res) => res.redirect(template.expand(req.params))
}
