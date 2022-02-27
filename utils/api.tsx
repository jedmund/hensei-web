import axios, { Axios, AxiosRequestConfig, AxiosResponse } from "axios"

interface Entity {
    name: string
}

type CollectionEndpoint = (params?: {}) => Promise<AxiosResponse<any>>
type IdEndpoint = ({ id }: { id: string }) => Promise<AxiosResponse<any>>
type IdWithObjectEndpoint = ({ id, object }: { id: string, object: string }) => Promise<AxiosResponse<any>>
type PostEndpoint = (object: {}, headers?: {}) => Promise<AxiosResponse<any>>
type PutEndpoint  = (id: string, object: {}, headers?: {}) => Promise<AxiosResponse<any>>
type DestroyEndpoint = (id: string, headers?: {}) => Promise<AxiosResponse<any>>

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
            getOne:  ({ id }: { id: string }) => axios.get(`${resourceUrl}/${id}/`),
            getOneWithObject:  ({ id, object }: { id: string, object: string }) => axios.get(`${resourceUrl}/${id}/${object}`),
            create:  (object: {}, headers?: {}) => axios.post(resourceUrl, object, headers),
            update:  (id: string, object: {}, headers?: {}) => axios.put(`${resourceUrl}/${id}`, object, headers),
            destroy: (id: string, headers?: {}) => axios.delete(`${resourceUrl}/${id}`, headers)
        } as EndpointMap
    }

    login(object: {}) {
        const oauthUrl = process.env.NEXT_PUBLIC_SIERO_OAUTH_URL || 'https://localhost:3000/oauth'
        return axios.post(`${ oauthUrl }/token`, object)
    }

    search(object: string, query: string, excludes: string) {
        const resourceUrl = `${this.url}/${name}`
        const url = (excludes.length > 0) ? 
            `${resourceUrl}search/${object}?query=${query}&excludes=${excludes}` :
            `${resourceUrl}search/${object}?query=${query}`
        return axios.get(url)
    }

    check(resource: string, value: string) {
        const resourceUrl = `${this.url}/check/${resource}`
        return axios.post(resourceUrl, {
            [resource]: value
        })
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
}

const api: Api = new Api({ url: process.env.NEXT_PUBLIC_SIERO_API_URL || 'https://localhost:3000/api/v1'})
api.createEntity( { name: 'users' })
api.createEntity( { name: 'parties' })
api.createEntity( { name: 'characters' })
api.createEntity( { name: 'weapons' })
api.createEntity( { name: 'summons' })
api.createEntity( { name: 'raids' })

export default api