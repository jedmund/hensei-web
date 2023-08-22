import React, { useCallback, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { getCookie } from 'cookies-next'
import { queryTypes, useQueryState } from 'next-usequerystate'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import clonedeep from 'lodash.clonedeep'

import api from '~utils/api'
import { setHeaders } from '~utils/userToken'
import extractFilters from '~utils/extractFilters'
import fetchLatestVersion from '~utils/fetchLatestVersion'
import useDidMountEffect from '~utils/useDidMountEffect'
import { appState } from '~utils/appState'
import { defaultFilterset } from '~utils/defaultFilters'
import { elements, allElement } from '~data/elements'
import { emptyPaginationObject } from '~utils/emptyStates'
import { convertAdvancedFilters } from '~utils/convertAdvancedFilters'

import ErrorSection from '~components/ErrorSection'
import GridRep from '~components/GridRep'
import GridRepCollection from '~components/GridRepCollection'
import FilterBar from '~components/filters/FilterBar'
import TeamsHead from '~components/head/TeamsHead'

import type { AxiosError } from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'
import type {
  FilterObject,
  PageContextObj,
  PaginationObject,
  ResponseStatus,
} from '~types'

interface Props {
  context?: PageContextObj
  version: AppUpdate
  error: boolean
  status?: ResponseStatus
}

const TeamsRoute: React.FC<Props> = ({
  context,
  version,
  error,
  status,
}: Props) => {
  // Set up router
  const router = useRouter()

  // Import translations
  const { t } = useTranslation('common')

  // Set up app-specific states
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Set up page-specific states
  const [parties, setParties] = useState<Party[]>([])
  const [raids, setRaids] = useState<Raid[]>()

  // Set up infinite scrolling-related states
  const [recordCount, setRecordCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Set up filter-specific query states
  // Recency is in seconds
  const [element, setElement] = useQueryState('element', {
    defaultValue: -1,
    history: 'push',
    parse: (query: string) => parseElement(query),
    serialize: (value) => serializeElement(value),
  })
  const [raid, setRaid] = useQueryState('raid', {
    defaultValue: 'all',
    history: 'push',
    parse: (query: string) => {
      const raids = context?.raidGroups.flatMap((group) => group.raids)
      const raid = raids?.find((r: Raid) => r.slug === query)
      return raid ? raid.id : 'all'
    },
    serialize: (value) => value,
  })
  const [recency, setRecency] = useQueryState('recency', {
    defaultValue: -1,
    history: 'push',
    parse: (query: string) => parseInt(query),
    serialize: (value) => `${value}`,
  })
  const [advancedFilters, setAdvancedFilters] =
    useState<FilterSet>(defaultFilterset)

  // Define transformers for element
  function parseElement(query: string) {
    let element: TeamElement | undefined =
      query === 'all'
        ? allElement
        : elements.find((element) => element.name.en.toLowerCase() === query)
    return element ? element.id : -1
  }

  function serializeElement(value: number | undefined) {
    let name = ''

    if (value != undefined) {
      if (value == -1) name = allElement.name.en.toLowerCase()
      else name = elements[value].name.en.toLowerCase()
    }

    return name
  }

  // Set the initial parties from props
  useEffect(() => {
    if (context && context.teams && context.pagination) {
      setTotalPages(context.pagination.totalPages)
      setRecordCount(context.pagination.count)
      replaceResults(context.pagination.count, context.teams)
      appState.raidGroups = context.raidGroups
      appState.version = version
    }
    setCurrentPage(1)
  }, [])

  // Add scroll event listener for shadow on FilterBar on mount
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch the user's advanced filters
  useEffect(() => {
    const filtersCookie = getCookie('filters')
    const filters = filtersCookie
      ? JSON.parse(filtersCookie as string)
      : defaultFilterset

    setAdvancedFilters(filters)
  }, [])

  // Handle errors
  const handleError = useCallback((error: any) => {
    if (error.response != null) {
      console.error(error)
    } else {
      console.error('There was an error.')
    }
  }, [])

  const fetchTeams = useCallback(
    ({ replace }: { replace: boolean }) => {
      const filters: {
        [key: string]: any
      } = {
        element: element !== -1 ? element : undefined,
        raid: raid === 'all' ? undefined : raid,
        recency: recency !== -1 ? recency : undefined,
        page: currentPage,
        ...convertAdvancedFilters(advancedFilters),
      }

      Object.keys(filters).forEach(
        (key) => filters[key] === undefined && delete filters[key]
      )

      const params = {
        params: {
          ...filters,
        },
      }

      api.endpoints.parties
        .getAll(params)
        .then((response) => {
          const results = response.data.results
          const meta = response.data.meta

          setTotalPages(meta.total_pages)
          setRecordCount(meta.count)

          if (replace) replaceResults(meta.count, results)
          else appendResults(results)
        })
        .catch((error) => handleError(error))
    },
    [currentPage, parties, element, raid, recency, advancedFilters]
  )

  function replaceResults(count: number, list: Party[]) {
    if (count > 0) {
      setParties(list.sort((a, b) => (a.created_at > b.created_at ? -1 : 1)))
    } else {
      setParties([])
    }
  }

  function appendResults(list: Party[]) {
    setParties([...parties, ...list])
  }

  // Fetch all raids on mount, then find the raid in the URL if present
  useEffect(() => {
    const raids = appState.raidGroups.flatMap((group) => group.raids)
    setRaids(raids)
  }, [setRaids])

  // When the element, raid or recency filter changes,
  // fetch all teams again.
  useDidMountEffect(() => {
    setCurrentPage(1)

    if (mounted) {
      fetchTeams({ replace: true })
    }

    setMounted(true)
  }, [element, raid, recency, advancedFilters])

  // When the page changes, fetch all teams again.
  useDidMountEffect(() => {
    // Current page changed
    if (currentPage > 1) fetchTeams({ replace: false })
    else if (currentPage == 1 && mounted) fetchTeams({ replace: true })
    setMounted(true)
  }, [currentPage])

  // Receive filters from the filter bar
  function receiveFilters(filters: FilterSet) {
    if (filters.element == 0) setElement(0, { shallow: true })
    else if (filters.element) setElement(filters.element, { shallow: true })
    if (filters.recency) setRecency(filters.recency, { shallow: true })
    if (filters.raid) setRaid(filters.raid, { shallow: true })
  }

  function receiveAdvancedFilters(filters: FilterSet) {
    setAdvancedFilters(filters)
  }

  // Methods: Favorites
  function toggleFavorite(teamId: string, favorited: boolean) {
    if (favorited) unsaveFavorite(teamId)
    else saveFavorite(teamId)
  }

  function saveFavorite(teamId: string) {
    api.saveTeam({ id: teamId }).then((response) => {
      if (response.status == 201) {
        const index = parties.findIndex((p) => p.id === teamId)
        const party = parties[index]

        party.favorited = true

        let clonedParties = clonedeep(parties)
        clonedParties[index] = party

        setParties(clonedParties)
      }
    })
  }

  function unsaveFavorite(teamId: string) {
    api.unsaveTeam({ id: teamId }).then((response) => {
      if (response.status == 200) {
        const index = parties.findIndex((p) => p.id === teamId)
        const party = parties[index]

        party.favorited = false

        let clonedParties = clonedeep(parties)
        clonedParties[index] = party

        setParties(clonedParties)
      }
    })
  }

  // Methods: Navigation
  function handleScroll() {
    if (window.pageYOffset > 90) setScrolled(true)
    else setScrolled(false)
  }

  function goTo(shortcode: string) {
    router.push(`/p/${shortcode}`)
  }

  // Methods: Page component rendering
  function pageHead() {
    return <TeamsHead />
  }

  function pageError() {
    if (status) return <ErrorSection status={status} />
    else return <div />
  }

  function renderParties() {
    return parties.map((party, i) => {
      return (
        <GridRep
          id={party.id}
          shortcode={party.shortcode}
          name={party.name}
          createdAt={new Date(party.created_at)}
          raid={party.raid}
          grid={party.weapons}
          user={party.user}
          favorited={party.favorited}
          fullAuto={party.full_auto}
          autoGuard={party.auto_guard}
          key={`party-${i}`}
          onClick={goTo}
          onSave={toggleFavorite}
        />
      )
    })
  }

  if (context) {
    return (
      <div className="teams">
        {pageHead()}
        <FilterBar
          defaultFilterset={defaultFilterset}
          onFilter={receiveFilters}
          onAdvancedFilter={receiveAdvancedFilters}
          persistFilters={true}
          scrolled={scrolled}
          element={element}
          raid={raid}
          raidGroups={context.raidGroups}
          recency={recency}
        >
          <h1>{t('teams.title')}</h1>
        </FilterBar>

        <section>
          <InfiniteScroll
            dataLength={parties && parties.length > 0 ? parties.length : 0}
            next={() => setCurrentPage(currentPage + 1)}
            hasMore={totalPages > currentPage}
            loader={
              <div className="notFound">
                <h2>{t('loading')}</h2>
              </div>
            }
          >
            <GridRepCollection>{renderParties()}</GridRepCollection>
          </InfiniteScroll>

          {parties.length == 0 ? (
            <div className="notFound">
              <h2>{t('teams.not_found')}</h2>
            </div>
          ) : (
            ''
          )}
        </section>
      </div>
    )
  } else return pageError()
}

export const getServerSidePaths = async () => {
  return {
    paths: [
      // Object variant:
      { params: { party: 'string' } },
    ],
    fallback: true,
  }
}

// prettier-ignore
export const getServerSideProps = async ({ req, res, locale, query }: { req: NextApiRequest, res: NextApiResponse, locale: string, query: { [index: string]: string } }) => {
  // Set headers for server-side requests
  setHeaders(req, res)

  // Fetch latest version
  const version = await fetchLatestVersion()

  // Fetch user's advanced filters
  const filtersCookie = getCookie('filters', { req: req, res: res })
  const advancedFilters = filtersCookie ? JSON.parse(filtersCookie as string) : undefined
  const convertedFilters = advancedFilters ? convertAdvancedFilters(advancedFilters) : undefined
  
  try {
    // Fetch and organize raids
    let raidGroups: RaidGroup[] = await api
      .raidGroups()
      .then((response) => response.data)

    // Create filter object
    const filters: FilterObject = extractFilters(query, raidGroups)
    const params = {
      params: { ...filters, ...convertedFilters },
    }

    // Set up empty variables
    let teams: Party[] | undefined = undefined
    let pagination: PaginationObject = emptyPaginationObject

    // Fetch initial set of parties
    const response = await api.endpoints.parties.getAll(params)

    // Assign values to pass to props
    teams = response.data.results
    pagination.count = response.data.meta.count
    pagination.totalPages = response.data.meta.total_pages
    pagination.perPage = response.data.meta.per_page

    // Consolidate data into context object
    const context: PageContextObj = {
      teams: teams,
      raidGroups: raidGroups,
      pagination: pagination,
    }

    // Pass to the page component as props
    return {
      props: {
        context: context,
        version: version,
        error: false,
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  } catch (error) {
    // Extract the underlying Axios error
    const axiosError = error as AxiosError
    const response = axiosError.response

    // Pass to the page component as props
    return {
      props: {
        context: null,
        error: true,
        status: {
          code: response?.status,
          text: response?.statusText,
        },
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  }
}

export default TeamsRoute
