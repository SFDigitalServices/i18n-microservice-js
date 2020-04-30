# i18n-microservice-js
This is a microservice for transforming Google Spreadsheets into [i18next]
translation data. There is currently only one endpoint:

## `/google/:sheetId`

### URL parameters
* `:sheetId` is the ID of the spreadsheet, which you can find in its URL:

    ```
    https://docs.google.com/spreadsheets/d/:sheetID/edit
    ```

### Query string parameters
* `sheet` filters the translations by one or more worksheet indices and/or
  titles. Multiple values are respected. Examples:

  - `?sheet=1` will match only the second worksheet (the first is index 0)
  - `?sheet=Generic+forms` will match only the worksheet titled "Generic
    forms"
  - `?sheet=*forms` will match all worksheets that end in "forms"
  - `?sheet=1&sheet=2` will get the 2nd and 3rd worksheets
  - `?sheet=!*wip*` will match worksheets that do _not_ contain "wip"

## Worksheet formatting
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

## Development

1. Copy `.env.template` to `.env` and fill in the required environment
   variables.

2. Run `npm run dev` to start the development server, which restarts whenever
   you modify source files (or `package.json`) using [nodemon].

3. Open `https://localhost:8001/google/:sheetId` with a public Google
   spreadsheet's id in place of `:sheetId`, and watch what happens in the
   console.

## Deployment
This service can be deployed pretty much anywhere, but we're deploying it on
Heroku for now. You'll need to set following environment variables ("config
vars" in Heroku):

- `GOOGLE_API_KEY` (**required**) is your Google API key.

[dotenv]: https://npm.im/dotenv
[nodemon]: https://npm.im/nodemon
