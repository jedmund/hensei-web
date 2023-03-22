import React, { useCallback, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { getCookie } from 'cookies-next'
import { queryTypes, useQueryState } from 'next-usequerystate'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import api from '~utils/api'
import extractFilters from '~utils/extractFilters'
import fetchLatestVersion from '~utils/fetchLatestVersion'
import organizeRaids from '~utils/organizeRaids'
import { setHeaders } from '~utils/userToken'
import useDidMountEffect from '~utils/useDidMountEffect'
import { appState } from '~utils/appState'
import { defaultFilterset } from '~utils/defaultFilters'
import { elements, allElement } from '~data/elements'
import { emptyPaginationObject } from '~utils/emptyStates'

import GridRep from '~components/GridRep'
import GridRepCollection from '~components/GridRepCollection'
import ErrorSection from '~components/ErrorSection'
import FilterBar from '~components/FilterBar'
import ProfileHead from '~components/ProfileHead'

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

const ProfileRoute: React.FC<Props> = ({
  context,
  version,
  error,
  status,
}: Props) => {
  // Set up router
  const router = useRouter()
  const { username } = router.query

  // Import translations
  const { t } = useTranslation('common')

  // Set up app-specific states
  const [raidsLoading, setRaidsLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)

  // Set up page-specific states
  const [parties, setParties] = useState<Party[]>([])
  const [raids, setRaids] = useState<Raid[]>()
  const [raid, setRaid] = useState<Raid>()

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
  const [raidSlug, setRaidSlug] = useQueryState('raid', {
    defaultValue: 'all',
    history: 'push',
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
      // TODO: Put an alert here
      console.error('There was an error.')
    }
  }, [])

  const fetchProfile = useCallback(
    ({ replace }: { replace: boolean }) => {
      const filters = {
        params: {
          element: element != -1 ? element : undefined,
          raid: raid ? raid.id : undefined,
          recency: recency != -1 ? recency : undefined,
          page: currentPage,
          ...advancedFilters,
        },
      }

      if (username && !Array.isArray(username)) {
        api.endpoints.users
          .getOne({
            id: username,
            params: { ...filters },
          })
          .then((response) => {
            const results = response.data.profile.parties
            const meta = response.data.meta

            setTotalPages(meta.total_pages)
            setRecordCount(meta.count)

            if (replace) replaceResults(meta.count, results)
            else appendResults(results)
          })
          .catch((error) => handleError(error))
      }
    },
    [currentPage, username, parties, element, raid, recency]
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
    api.endpoints.raids.getAll().then((response) => {
      setRaids(response.data)

      setRaidsLoading(false)

      const raid = response.data.find((r: Raid) => r.slug === raidSlug)
      setRaid(raid)

      return raid
    })
  }, [setRaids])

  // When the element, raid or recency filter changes,
  // fetch all teams again.
  useDidMountEffect(() => {
    setCurrentPage(1)
    fetchProfile({ replace: true })
  }, [username, element, raid, recency, advancedFilters])

  // When the page changes, fetch all teams again.
  useDidMountEffect(() => {
    // Current page changed
    if (currentPage > 1) fetchProfile({ replace: false })
    else if (currentPage == 1) fetchProfile({ replace: true })
  }, [currentPage])

  // Receive filters from the filter bar
  function receiveFilters(filters: FilterSet) {
    if (filters.element == 0) setElement(0, { shallow: true })
    else if (filters.element) setElement(filters.element, { shallow: true })

    if (raids && filters.raidSlug) {
      const raid = raids.find((raid) => raid.slug === filters.raidSlug)
      setRaid(raid)
      setRaidSlug(filters.raidSlug, { shallow: true })
    }

    if (filters.recency) setRecency(filters.recency, { shallow: true })

    delete filters.element
    delete filters.raidSlug
    delete filters.recency

    setAdvancedFilters(filters)
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
    if (context && context.user) return <ProfileHead user={context.user} />
  }

  function pageError() {
    if (status) return <ErrorSection status={status} />
    else return <div />
  }

  // TODO: Add save functions

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
          favorited={party.favorited}
          fullAuto={party.full_auto}
          key={`party-${i}`}
          onClick={goTo}
        />
      )
    })
  }

  if (context) {
    return (
      <div id="Profile">
        {pageHead()}
        <FilterBar
          onFilter={receiveFilters}
          scrolled={scrolled}
          element={element}
          raidSlug={raidSlug ? raidSlug : undefined}
          recency={recency}
        >
          <div className="UserInfo">
            <img
              alt={context.user?.avatar.picture}
              className={`profile ${context.user?.avatar.element}`}
              srcSet={`/profile/${context.user?.avatar.picture}.png,
                                    /profile/${context.user?.avatar.picture}@2x.png 2x`}
              src={`/profile/${context.user?.avatar.picture}.png`}
            />
            <h1>{context.user?.username}</h1>
          </div>
        </FilterBar>

        <section>
          <InfiniteScroll
            dataLength={parties && parties.length > 0 ? parties.length : 0}
            next={() => setCurrentPage(currentPage + 1)}
            hasMore={totalPages > currentPage}
            loader={
              <div id="NotFound">
                <h2>Loading...</h2>
              </div>
            }
          >
            <GridRepCollection>{renderParties()}</GridRepCollection>
          </InfiniteScroll>

          {parties.length == 0 ? (
            <div id="NotFound">
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
  const advancedFilters = filtersCookie
    ? JSON.parse(filtersCookie as string)
    : undefined

  try {
    // Fetch and organize raids
    let { raids, sortedRaids } = await api.endpoints.raids
      .getAll()
      .then((response) => organizeRaids(response.data))

    // Create filter object
    const filters: FilterObject = extractFilters(query, raids)
    const params = {
      params: { ...filters, ...advancedFilters },
    }

    // Set up empty variables
    let user: User | undefined = undefined
    let teams: Party[] | undefined = undefined
    let pagination: PaginationObject = emptyPaginationObject

    // Perform a request only if we received a username
    if (query.username) {
      const response = await api.endpoints.users.getOne({
        id: query.username,
        params,
      })

      // Assign values to pass to props
      user = response.data.profile

      if (response.data.profile.parties) teams = response.data.profile.parties
      else teams = []

      pagination.count = response.data.meta.count
      pagination.totalPages = response.data.meta.total_pages
      pagination.perPage = response.data.meta.per_page
    }

    // Consolidate data into context object
    const context: PageContextObj = {
      user: user,
      teams: teams,
      raids: raids,
      sortedRaids: sortedRaids,
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

export default ProfileRoute
