const anymatch = require('anymatch')
const express = require('express')
const { asyncJsonHandler } = require('./handlers')
const cache = require('./cache')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const SPLAT = '*'

module.exports = ({ apiKey }) => {
  const app = express()

  app.get('/:sheetId/:version', asyncJsonHandler(async (req, res, next) => {
    const query = Object.assign({}, req.query, req.params)
    return getTranslations(query)
  }))

  app.get('/:sheetId', asyncJsonHandler(async (req, res, next) => {
    const query = Object.assign({}, req.query, req.params)
    return getTranslations(query)
  }))

  return app

  async function getTranslations (params) {
    const { sheetId, sheet, version = Date.now() } = params
    const doc = await getSheet(sheetId, version)

    const data = {}
    const matches = sheet ? anymatch(sheet) : () => true

    for (const sheet of doc.sheets) {
      const { index, title } = sheet
      if (matches(index) || matches(title)) {
        console.warn('Loading sheet #%d: "%s"...', index, title)
      } else {
        console.warn('Skipping sheet #%d: "%s"', index, title)
        continue
      }

      const { rows, header: [keyColumn, ...locales] } = sheet
      console.warn('Reading %d rows, key column: "%s", locales: %s', rows.length, keyColumn, JSON.stringify(locales))

      for (const locale of locales) {
        if (!data[locale]) {
          data[locale] = {}
        }
      }

      for (const row of rows) {
        const key = row[keyColumn]
        for (const locale of locales) {
          if (row[locale]) {
            if (key) data[locale][key] = trim(row[locale])
            if (locale !== 'en') data[locale][row.en] = trim(row[locale])
          } else if (key) {
            console.warn('key "%s" missing locale "%s"', key, locale)
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
      throw new GoogleError(error)
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

class GoogleError {
  constructor (error, message = '') {
    this.message = message || 'There was a problem getting the spreadsheet info from Google.'
    this.data = {
      message: this.message,
      ...error.response.data.error
    }
  }
}
