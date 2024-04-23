import { useCallback, useState } from 'react'
import api from '~utils/api'

export const useFetchTeams = (
  currentPage: number,
  filters: { [key: string]: any },
  parties: Party[],
  setParties: (value: Party[]) => void,
  setTotalPages: (value: number) => void,
  setRecordCount: (value: number) => void
) => {
  const [loaded, setLoaded] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState(false)

  function parseTeams(response: { [key: string]: any }, replace: boolean) {
    const { parties, meta } = response

    setTotalPages(meta.total_pages)
    setRecordCount(meta.count)
    setLoaded(true)

    if (replace) {
      replaceResults(parties)
      setFetching(false)
    } else appendResults(parties)
  }

  function parseError(error: any) {
    setLoaded(true)
    setFetching(false)
    setError(true)
  }

  function processTeams(list: Party[], shouldReplace: boolean) {
    if (shouldReplace) {
      replaceResults(list)
    } else {
      appendResults(list)
    }
  }

  function replaceResults(list: Party[]) {
    if (list.length > 0) {
      setParties(list.sort((a, b) => (a.created_at > b.created_at ? -1 : 1)))
    } else {
      setParties([])
    }
  }

  function appendResults(list: Party[]) {
    setParties([...parties, ...list])
  }

  function createParams() {
    return {
      params: Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {} as { [key: string]: any }),
    }
  }

  const fetchTeams = useCallback(
    ({ replace } = { replace: false }) => {
      if (replace) setFetching(true)

      const params = createParams()

      api.endpoints.parties
        .getAll(params)
        .then((response) => {
          const formedResponse = {
            parties: response.data.results,
            meta: response.data.meta,
          }

          return parseTeams(formedResponse, replace)
        })
        .catch(parseError)
    },
    [filters, currentPage]
  )

  const fetchProfile = useCallback(
    ({
      username,
      replace,
    }: {
      username: string | undefined
      replace: boolean
    }) => {
      if (replace) setFetching(true)

      const params = createParams()

      if (username && !Array.isArray(username)) {
        api.endpoints.users
          .getOne({
            id: username,
            params: params,
          })
          .then((response) => {
            const formedResponse = {
              parties: response.data.profile.parties,
              meta: response.data.meta,
            }

            return parseTeams(formedResponse, replace)
          })
          .catch(parseError)
      }
    },
    [currentPage, filters]
  )

  const fetchSaved = useCallback(
    ({ replace } = { replace: false }) => {
      if (replace) setFetching(true)

      const params = createParams()

      api
        .savedTeams(params)
        .then((response) => {
          const formedResponse = {
            parties: response.data.results,
            meta: response.data.meta,
          }

          return parseTeams(formedResponse, replace)
        })
        .catch(parseError)
    },
    [filters, currentPage]
  )

  return {
    fetchTeams,
    fetchProfile,
    fetchSaved,
    processTeams,
    loaded,
    fetching,
    setFetching,
    error,
  }
}
