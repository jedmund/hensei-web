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
  
  constructor({url}: {url: string}) {
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
  
  search({ object, query, filters, locale = "en", page = 0 }: 
  { object: string, query: string, filters?: { [key: string]: number[] }, locale?: string,  page?: number }) {
    const resourceUrl = `${this.url}/${name}`
    return axios.post(`${resourceUrl}search/${object}`, {
      search: {
        query: query,
        filters: filters,
        locale: locale,
        page: page
      }
    })
  }
  
  check(resource: string, value: string) {
    const resourceUrl = `${this.url}/check/${resource}`
    return axios.post(resourceUrl, {
      [resource]: value
    })
  }
  
  resolveCharacterConflict({ incoming, conflicting, position, params }: {
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
    const resourceUrl = `${this.url}/characters/resolve`
    return axios.post(resourceUrl, body, { headers: params })
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
  
  updateUncap(resource: 'character'|'weapon'|'summon', id: string, value: number) {
    const pluralized = resource + 's'
    const resourceUrl = `${this.url}/${pluralized}/update_uncap`
    return axios.post(resourceUrl, {
      [resource]: {
        id: id,
        uncap_level: value
      }
    })
  }
  
  userInfo(id: string) {
    const resourceUrl = `${this.url}/users/info/${id}`
    return axios.get(resourceUrl)
  }
}

const api: Api = new Api({ url: process.env.NEXT_PUBLIC_SIERO_API_URL || 'https://localhost:3000/api/v1'})
api.createEntity( { name: 'users' })
api.createEntity( { name: 'parties' })
api.createEntity( { name: 'grid_weapons' })
api.createEntity( { name: 'characters' })
api.createEntity( { name: 'weapons' })
api.createEntity( { name: 'summons' })
api.createEntity( { name: 'jobs' })
api.createEntity( { name: 'raids' })
api.createEntity( { name: 'weapon_keys' })
api.createEntity( { name: 'favorites' })

export default api
