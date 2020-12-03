# i18n-microservice-js
This is a microservice for transforming Google Spreadsheets into [i18next]
translation data. The API endpoints are:

| Endpoint | Description |
| :-- | :--- |
| [/phrase/:projectId](#phraseprojectid) | Fetch translations from a Phrase project by ID |
| [/phrase/projects/:id](#phraseprojectsid) | Fetch information about phrase projects |
| [/google/:sheetId](#googlesheetid) | Fetch translations from a Google Sheet by ID |


## `/phrase/:projectId`
This endpoint outputs Phrase project metdata as JSON, and can be
used to link to a project on phrase.com with only the project ID.

### URL parameters
* `:projectId` is the Phrase project ID, which you can find in the
  project's settings on phrase.com.

### Environment variables
* `PHRASE_ACCESS_TOKEN` is an access token with permissions to view
  the `city-county-of-san-francisco` Phrase account.


## `/phrase/projects/:id`
This endpoint outputs Phrase project metdata as JSON, and can be
used to link to a project on phrase.com with only the project ID.

### URL parameters
* `:id` is the Phrase project ID, which you can find in the
  project's settings on phrase.com.

### Query parameters
* `redirect=true` will send an HTTP redirect to the project
  dashboard on phrase.com.

### Environment variables
* `PHRASE_ACCESS_TOKEN` is an access token with permissions to view
  the `city-county-of-san-francisco` Phrase account.

## Development

1. Copy `.env.template` to `.env` and fill in the required environment
   variables.

2. Run `npm run dev` to start the development server, which restarts whenever
   you modify source files (or `package.json`) using [nodemon].

3. Open `https://localhost:8001/google/:sheetId` with a public Google
   spreadsheet's id in place of `:sheetId`, and watch what happens in the
   console.

## `/google/:sheetId`
This endpoint outputs form translations fetched from a Google Sheet
with a known [format](#worksheet-formatting).

### URL parameters
* `:sheetId` is the ID of the spreadsheet, which you can find in its URL between `/d/` and `/edit`:

    ```
    https://docs.google.com/spreadsheets/d/:sheetID/edit
                                           ⬆-----⬆
                                           this part
    ```

### Query parameters
* `sheet` filters the translations by one or more worksheet indices and/or
  titles. Multiple values are respected. Examples:

  - `?sheet=1` will match only the second worksheet (the first is index 0)
  - `?sheet=Generic+forms` will match only the worksheet titled "Generic
    forms"
  - `?sheet=*forms` will match all worksheets that end in "forms"
  - `?sheet=1&sheet=2` will get the 2nd and 3rd worksheets
  - `?sheet=!*wip*` will match worksheets that do _not_ contain "wip"

### Worksheet formatting
Worksheets are expected to have a "key" column followed by one or more language
code columns. The name of the key column isn't significant, but for consistency
it should be "String" or "Key".

All of the rest of the columns should be named with [IETF language
tags](https://en.wikipedia.org/wiki/IETF_language_tag), e.g. `en` for English,
`es` for Spanish, `zh` for Chinese, or `tl` for Tagalog. For instance:

| String | en | es |
| :--- | :--- | :--- |
| hello | Hi | Hola |
| goodbye | Bye | Adiós |

The first ("key") column may be empty, in which case the English translation
will be used as the key.

### Environment variables
* `GOOGLE_API_KEY` is used to access the Google Sheets API. The
  sheet(s) must be visible to the account from which the API key
  was created.

[i18next]: https://www.i18next.com
