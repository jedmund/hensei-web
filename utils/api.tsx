import axios, { AxiosRequestConfig, AxiosResponse } from "axios"

const { REACT_APP_SIERO_API_URL, REACT_APP_SIERO_OAUTH_URL } = process.env

interface Entity {
    name: string
}

type CollectionEndpoint = ({ query }: { query: AxiosRequestConfig }) => Promise<AxiosResponse<any>>
type IdEndpoint = ({ id }: { id: string }) => Promise<AxiosResponse<any>>
type PostEndpoint = (object: {}, headers?: {}) => Promise<AxiosResponse<any>>

interface EndpointMap {
    getAll: CollectionEndpoint
    getOne: IdEndpoint
    create: PostEndpoint
    update: PostEndpoint
    destroy: IdEndpoint
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
            getAll:  ({ query }: { query: AxiosRequestConfig }) => axios.get(resourceUrl, { params: { query }}),
            getOne:  ({ id }: { id: string }) => axios.get(`${resourceUrl}/${id}`),
            create:  (object: {}, headers?: {}) => axios.post(resourceUrl, object, headers),
            update:  (object: {}, headers?: {}) => axios.put(resourceUrl, object, headers),
            destroy: ({ id }: { id: string }) => axios.delete(`${resourceUrl}/${id}`)
        } as EndpointMap
    }

    login(object: {}) {
        return axios.post(`${ REACT_APP_SIERO_OAUTH_URL || 'http://127.0.0.1:3000/oauth' }/token`, object)
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
}

const api: Api = new Api({ url: REACT_APP_SIERO_API_URL || 'http://127.0.0.1:3000/api/v1' })
api.createEntity( { name: 'users' })
api.createEntity( { name: 'parties' })
api.createEntity( { name: 'characters' })
api.createEntity( { name: 'weapons' })
api.createEntity( { name: 'summons' })

export default api