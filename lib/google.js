const anymatch = require('anymatch')
const cache = require('express-memjs-cache')
const { Router } = require('express')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { publicVersionedJson } = require('./handlers')
const { success, debug, warn } = require('./log').scope('google')

const { GOOGLE_API_KEY } = process.env

if (!GOOGLE_API_KEY) {
  warn('GOOGLE_API_KEY is not set!')
}

module.exports = Router()
  .use((req, res, next) => {
    Object.assign(res.locals, req.params, req.query)
    next()
  })
  .use(cache({
    logger: require('./log').scope('cache'),
    getCacheKey (req, res) {
      const { sheetId, version } = res.locals
      return version ? `google:${sheetId}@${version}` : null
    },
    isError (req, res, { body }) {
      try {
        const parsed = JSON.parse(body)
        if (parsed.status === 'error') {
          return true
        }
      } catch (error) {
        warn('unable to parse body as JSON:', body)
        return true
      }
      return res.statusCode >= 400
    }
  }))
  .get('/', publicVersionedJson((req, res) => {
    return getTranslations(res.locals)
  }))

async function getTranslations (params) {
  const { sheetId, sheet } = params
  debug('sheetId:', sheetId)
  const doc = await loadSheet(sheetId)

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

async function loadSheet (sheetId) {
  // spreadsheet key is the long id in the sheets URL
  const doc = new GoogleSpreadsheet(sheetId)
  await doc.useApiKey(GOOGLE_API_KEY)

  try {
    await doc.loadInfo() // loads document properties and worksheets
  } catch (error) {
    throw new GoogleAPIError(error, 'Failed to load spreadsheet')
  }

  const sheets = []

  for (const [index, worksheet] of Object.entries(doc.sheetsByIndex)) {
    const { title, sheetId: id } = worksheet
    const rows = await worksheet.getRows()
    const header = worksheet.headerValues
    sheets.push({ title, id, index, header, rows })
  }

  return {
    title: doc.title,
    sheets
  }
}

function trim (val) {
  return (typeof val === 'string') ? val.trim() : val
}

class GoogleAPIError {
  constructor (error, messagePrefix = '') {
    // console.warn('Google API error:', error.response)
    const { message, code = 500, status } = error.response
    this.data = {
      message: message ? `${messagePrefix}: ${message}` : messagePrefix,
      code: code,
      status
    }
  }
}
