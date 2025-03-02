import axios, { Axios, AxiosRequestConfig, AxiosResponse } from "axios"

interface Entity {
  name: string
}

// prettier-ignore
type CollectionEndpoint = (params?: {}) => Promise<AxiosResponse<any>>
type IdEndpoint = ({ id, params }: { id: string, params?: {} }) => Promise<AxiosResponse<any>>
type IdWithObjectEndpoint = ({ id, object, params }: { id: string, object: string, params?: {} }) => Promise<AxiosResponse<any>>
type PostEndpoint = (object: {}, headers?: {}) => Promise<AxiosResponse<any>>
type PutEndpoint  = (id: string, object: {}, headers?: {}) => Promise<AxiosResponse<any>>
type DestroyEndpoint = ({ id, params }: { id: string, params?: {} }) => Promise<AxiosResponse<any>>

interface EndpointMap {
  getAll: CollectionEndpoint
  getOne: IdEndpoint
  getOneWithObject: IdWithObjectEndpoint
  create: PostEndpoint
  update: PutEndpoint
  destroy: DestroyEndpoint
}

class Api {
  url: string
  endpoints: { [key: string]: EndpointMap }
  
  constructor({ url }: { url: string }) {
    this.url = url
    this.endpoints = {}
  }
  
  createEntity(entity: Entity) {
    this.endpoints[entity.name] = this.createEndpoints(entity)
  }
  
  createEntities(entities: Entity[]) {
    entities.forEach(this.createEntity.bind(this))
  }
  
  createEndpoints({name}: {name: string}) {
    const resourceUrl = `${this.url}/${name}`
    
    return {
      getAll:  (params?: {}) => axios.get(resourceUrl, params),
      getOne:  ({ id, params }: { id: string, params?: {} }) => axios.get(`${resourceUrl}/${id}/`, params),
      getOneWithObject:  ({ id, object, params }: { id: string, object: string, params?: {} }) => axios.get(`${resourceUrl}/${id}/${object}`, params),
      create:  (object: {}, headers?: {}) => axios.post(resourceUrl, object, headers),
      update:  (id: string, object: {}, headers?: {}) => axios.put(`${resourceUrl}/${id}`, object, headers),
      destroy: ({ id, params }: { id: string, params?: {} }) => axios.delete(`${resourceUrl}/${id}`, params)
    } as EndpointMap
  }
  
  login(object: {}) {
    const oauthUrl = process.env.NEXT_PUBLIC_SIERO_OAUTH_URL || 'https://localhost:3000/oauth'
    return axios.post(`${ oauthUrl }/token`, object)
  }
  
  search({ object, query, job, filters, locale = "en", page = 0 }: 
  { object: string, query: string, job?: string, filters?: { [key: string]: number[] }, locale?: string,  page?: number }) {
    const resourceUrl = `${this.url}/${name}`
    return axios.post(`${resourceUrl}search/${object}`, {
      search: {
        query: query,
        filters: filters,
        job: job,
        locale: locale,
        page: page
      }
    })
  }

  searchAll(query: string, exclude: string[], locale: string) {
    const resourceUrl = `${this.url}/search`
    // Also send list of Granblue IDs 
    // so the backend can exclude opposites and duplicates
    // Maybe store them in state???
    return axios.post(`${resourceUrl}`, {
      search: {
        query: query,
        exclude: exclude,
        locale: locale
      }
    })
  }
  
  check(resource: string, value: string) {
    const resourceUrl = `${this.url}/check/${resource}`
    return axios.post(resourceUrl, {
      [resource]: value
    })
  }
  
  resolveConflict({ object, incoming, conflicting, position, params }: {
    object: 'characters' | 'weapons'
    incoming: string
    conflicting: string[]
    position: number,
    params?: {}
  }) {
    const body = {
      resolve: {
        incoming: incoming,
        conflicting: conflicting,
        position: position,
      },
    }
    const resourceUrl = `${this.url}/${object}/resolve`
    return axios.post(resourceUrl, body, { headers: params })
  }

  updateJob({ partyId, params }: { partyId: string, params?: {} }) {
    const resourceUrl = `${this.url}/parties/${partyId}/jobs`
    return axios.put(resourceUrl, params)
  }

  updateJobSkills({ partyId, params }: { partyId: string, params?: {} }) {
    const resourceUrl = `${this.url}/parties/${partyId}/job_skills`
    return axios.put(resourceUrl, params)
  }

  removeJobSkill({ partyId, position, params }: { partyId: string, position: number, params?: {} }) {
    const resourceUrl = `${this.url}/parties/${partyId}/job_skills`
    return axios.delete(resourceUrl, { data: { party: { skill_position: position } }, headers: params })
  }

  allJobSkills(params?: {}) {
    const resourceUrl = `${this.url}/jobs/skills`
    return axios.get(resourceUrl, params)
  }

  jobSkillsForJob(jobId: string, params?: {}) {
    const resourceUrl = `${this.url}/jobs/${jobId}/skills`
    return axios.get(resourceUrl, params)
  }

  jobAccessoriesForJob(jobId: string, params?: {}) {
    const resourceUrl = `${this.url}/jobs/${jobId}/accessories`
    return axios.get(resourceUrl, params)
  }

  previewUrl(id: string): string {
    return `${this.url}/parties/${id}/preview`
  }

  raidGroups(params?: {}) {
    const resourceUrl = `${this.url}/raids/groups`
    return axios.get(resourceUrl, params)
  }

  remix({ shortcode, body, params}: { shortcode: string, body?: {}, params?: {} }) {
    const resourceUrl = `${this.url}/parties/${shortcode}/remix`
    return axios.post(resourceUrl, body, params)
  }

  savedTeams(params: {}) {
    const resourceUrl = `${this.url}/parties/favorites`
    return axios.get(resourceUrl, params)
  }
  
  saveTeam({ id, params }: { id: string, params?: {} }) {
    const body = { favorite: { party_id: id } }
    const resourceUrl = `${this.url}/favorites`
    return axios.post(resourceUrl, body, { headers: params })
  }
  
  unsaveTeam({ id, params }: { id: string, params?: {} }) {
    const body = { favorite: { party_id: id } }
    const resourceUrl = `${this.url}/favorites`
    return axios.delete(resourceUrl, { data: body, headers: params })
  }

  updateQuickSummon({ id, value, params }: { id: string, value: boolean, params?: {} }) {
    const body = { summon: { id: id, quick_summon: value } }
    const resourceUrl = `${this.url}/summons/update_quick_summon`
    return axios.post(resourceUrl, body, { headers: params })
  }

  updateUncap(resource: 'character'|'weapon'|'summon', id: string, value: number) {
    const pluralized = resource + 's'
    const resourceUrl = `${this.url}/${pluralized}/update_uncap`
    return axios.post(resourceUrl, {
      [resource]: {
        id: id,
        uncap_level: value,
        transcendence_step: 0
      }
    })
  }

  updateTranscendence(resource: 'character'|'summon'|'weapon', id: string, value: number) {
    const pluralized = resource + 's'
    const resourceUrl = `${this.url}/${pluralized}/update_uncap`
    return axios.post(resourceUrl, {
      [resource]: {
        id: id,
        transcendence_step: value
      }
    })
  }
  
  userInfo(username: string) {
    const resourceUrl = `${this.url}/users/info/${username}`
    return axios.get(resourceUrl)
  }

  version() {
    const resourceUrl = `${this.url}/version`
    return axios.get(resourceUrl)
  }
}

const api: Api = new Api({ url: process.env.NEXT_PUBLIC_SIERO_API_URL || 'https://localhost:3000/v1'})
api.createEntity({ name: 'users' })
api.createEntity({ name: 'parties' })
api.createEntity({ name: 'characters' })
api.createEntity({ name: 'weapons' })
api.createEntity({ name: 'summons' })
api.createEntity({ name: 'grid_characters' })
api.createEntity({ name: 'grid_weapons' })
api.createEntity({ name: 'grid_summons' })
api.createEntity({ name: 'characters' })
api.createEntity({ name: 'weapons' })
api.createEntity({ name: 'summons' })
api.createEntity({ name: 'jobs' })
api.createEntity({ name: 'raids' })
api.createEntity({ name: 'weapon_keys' })
api.createEntity({ name: 'favorites' })

export default api
