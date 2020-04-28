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
  titles. For instance:

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
`es` for Spanish, `zh-TW` for Chinese (Taiwan), or `tl` for Tagalog. For
instance:

| String | en | es |
| :--- | :--- | :--- |
| hello | Hi | Hola |
| goodbye | Bye | Adiós |

The first ("key") column may be empty, in which case the English translation
will be used as the key.

## Deployment
This service can be deployed pretty much anywhere, but we're deploying it on
Heroku for now. You will need to configure one of the two environment variables:

- `GOOGLE_AUTH_CREDS` is the _contents_ of your [Google service account]
  credentials as a JSON-encoded string.
- `GOOGLE_AUTH_CREDS_PATH` is the path of your [Google service account]
  JSON credentials file, which defaults to `.google-service-credentials.json`
  if `GOOGLE_AUTH_CREDS` is not set.

[google service account]: https://cloud.google.com/iam/docs/service-accounts
