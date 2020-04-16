const anymatch = require('anymatch')
const express = require('express')
const { asyncJsonHandler } = require('./async')
const { GoogleSpreadsheet } = require('google-spreadsheet')

module.exports = ({ credentials }) => {
  const app = express()

  app.get('/:sheetId', asyncJsonHandler(async (req, res, next) => {
    const query = Object.assign({}, req.params, req.query)
    return getTranslations(query)
  }))

  async function getTranslations ({ sheetId, worksheets = '*' }) {
    // spreadsheet key is the long id in the sheets URL
    const doc = new GoogleSpreadsheet(sheetId)

    try {
      await doc.useServiceAccountAuth(credentials)
    } catch (error) {
      throw new Error('Unable to use service account auth!')
    }

    try {
      await doc.loadInfo() // loads document properties and worksheets
    } catch (error) {
      throw new GoogleError(error)
    }

    const data = {}
    const matches = anymatch(worksheets)

    for (const [index, sheet] of Object.entries(doc.sheetsByIndex)) {
      if (matches(index) || matches(sheet.title)) {
        console.warn('Loading sheet #%d: "%s"...', index, sheet.title)
      } else {
        console.warn('Skipping sheet #%d: "%s"', index, sheet.title)
        continue
      }

      const rows = await sheet.getRows()
      const [keyColumn, ...locales] = sheet.headerValues
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
          } else {
            console.warn('string "%s" missing locale "%s"', key, locale)
          }
        }
      }
    }

    return data
  }

  return app
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
