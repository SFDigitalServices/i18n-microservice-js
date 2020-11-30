import { phraseConfig } from '../lib/phrase'
import { ProjectsApi } from 'phrase-js'
import { asyncJsonHandler } from '../lib/handlers'

const { PHRASE_ORG_SLUG = 'city-county-of-san-francisco' } = process.env
const api = new ProjectsApi(phraseConfig)

export default asyncJsonHandler(async (req, res) => {
  const { id, redirect } = req.query
  if (id) {
    const project = await api.projectShow({ id })
    const url = `https://app.phrase.com/accounts/${PHRASE_ORG_SLUG}/projects/${project.slug}/dashboard`
    if (redirect === 'true') {
      res.redirect(url)
    } else {
      return { project, url }
    }
  } else {
    return api.projectsList(req.query)
  }
})
