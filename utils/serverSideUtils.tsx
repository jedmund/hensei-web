import { getCookie } from 'cookies-next'
import { NextApiRequest, NextApiResponse } from 'next'
import api from './api'
import extractFilters from './extractFilters'
import { FilterObject } from '~types'
import { permissiveFilterset } from './defaultFilters'

// Parse advanced filters from cookies
export function parseAdvancedFilters(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const filtersCookie = getCookie('filters', { req, res })
  return filtersCookie ? JSON.parse(filtersCookie as string) : undefined
}

// Fetch raid groups and create filter object
export async function fetchRaidGroupsAndFilters(query: {
  [index: string]: string
}) {
  const raidGroups = await api.raidGroups().then((response) => response.data)
  const filters = extractFilters(query, raidGroups)
  return { raidGroups, filters }
}

// Fetch initial set of parties
export async function fetchParties(
  filters: FilterObject,
  convertedFilters: ConvertedFilters | undefined
) {
  const params = { params: { ...filters, ...convertedFilters } }
  const response = await api.endpoints.parties.getAll(params)

  return {
    teams: response.data.results,
    pagination: {
      count: response.data.meta.count,
      totalPages: response.data.meta.total_pages,
      perPage: response.data.meta.per_page,
    },
  }
}

export async function fetchUserProfile(
  username: string,
  filters: FilterObject
) {
  const params = { params: { ...filters, ...permissiveFilterset } }
  const response = await api.endpoints.users.getOne({
    id: username,
    params,
  })

  return {
    user: response.data.profile,
    teams: response.data.profile.parties,
    pagination: {
      count: response.data.meta.count,
      totalPages: response.data.meta.total_pages,
      perPage: response.data.meta.per_page,
    },
  }
}

export async function fetchSaved(filters: FilterObject) {
  const params = { params: { ...filters, ...permissiveFilterset } }
  const response = await api.savedTeams(params)

  return {
    teams: response.data.results,
    pagination: {
      count: response.data.meta.count,
      totalPages: response.data.meta.total_pages,
      perPage: response.data.meta.per_page,
    },
  }
}
