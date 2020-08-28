const anymatch = require('anymatch')
const express = require('express')
const { asyncJsonHandler } = require('./handlers')
const cache = require('./cache')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { success, debug, warn } = require('./log').scope('google')

module.exports = ({ apiKey }) => {
  const app = express()

  const handler = asyncJsonHandler(async (req, res, next) => {
    // yes, HTTP misspells it as "referer" :facepalm:
    debug('request:', req.path, '← referrer:', req.header('referer'))
    // combine the query string and path params into a single query object
    const query = Object.assign({}, req.query, req.params)
    return getTranslations(query)
  })

  app.get('/:sheetId/:version', handler)
  app.get('/:sheetId', handler)

  return app

  async function getTranslations (params) {
    const { sheetId, sheet, version = Date.now() } = params
    const doc = await getSheet(sheetId, version)

    const data = {}
    const matches = sheet ? anymatch(sheet) : () => true

    for (const sheet of doc.sheets) {
      const { index, title } = sheet
      if (matches(index) || matches(title)) {
        success('matched sheet #%d "%s" (%d rows)', index, title, sheet.rows.length)
      } else {
        debug('skipping sheet #%d: "%s"', index, title)
        continue
      }

      const { rows, header: [keyColumn, ...locales] } = sheet
      for (const locale of locales) {
        if (!data[locale]) {
          data[locale] = {}
        }
      }

      for (const row of rows) {
        const key = row[keyColumn]
        if (locales.every(locale => !row[locale])) {
          warn('skipping key "%s" (no locales)', key)
          continue
        }
        for (const locale of locales) {
          if (row[locale]) {
            if (key) data[locale][key] = trim(row[locale])
            if (locale !== 'en') data[locale][row.en] = trim(row[locale])
          } else if (key) {
            warn('key "%s" missing locale "%s"', key, locale)
          }
        }
      }
    }

    return data
  }

  async function getSheet (id, version) {
    const key = `google:${id}@${version}`
    return cache.getOrSet(key, () => loadSheet({ id, version }))
  }

  async function loadSheet ({ id, version }) {
    // spreadsheet key is the long id in the sheets URL
    const doc = new GoogleSpreadsheet(id)
    doc.useApiKey(apiKey)

    try {
      await doc.loadInfo() // loads document properties and worksheets
    } catch (error) {
      throw new GoogleAPIError(error, 'Failed to load spreadsheet')
    }

    const sheets = []
    const sheetsById = {}
    const sheetsByTitle = {}

    for (const [index, worksheet] of Object.entries(doc.sheetsByIndex)) {
      const { title, sheetId: id } = worksheet
      const rows = await worksheet.getRows()
      const header = worksheet.headerValues
      const sheet = { title, id, index, header, rows }
      sheets.push(sheet)
      sheetsById[id] = sheet
      sheetsByTitle[title] = sheet
    }

    return {
      title: doc.title,
      sheets,
      sheetsById,
      sheetsByTitle
    }
  }
}

function trim (val) {
  return (typeof val === 'string') ? val.trim() : val
}

class GoogleAPIError {
  constructor (error, messagePrefix = '') {
    const { message, code = 500, status } = error.response.data.error
    this.data = {
      message: message ? `${messagePrefix}: ${message}` : messagePrefix,
      code: code,
      status
    }
  }
}
