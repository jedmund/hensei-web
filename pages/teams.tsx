import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'

import { queryTypes, useQueryState } from 'next-usequerystate'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import InfiniteScroll from 'react-infinite-scroll-component'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import clonedeep from 'lodash.clonedeep'

import api from '~utils/api'
import setUserToken from '~utils/setUserToken'
import extractFilters from '~utils/extractFilters'
import organizeRaids from '~utils/organizeRaids'
import useDidMountEffect from '~utils/useDidMountEffect'
import { elements, allElement } from '~utils/Element'
import { emptyPaginationObject } from '~utils/emptyStates'

import GridRep from '~components/GridRep'
import GridRepCollection from '~components/GridRepCollection'
import FilterBar from '~components/FilterBar'

import type { NextApiRequest, NextApiResponse } from 'next'
import type { FilterObject, PaginationObject } from '~types'

interface Props {
  teams?: Party[]
  meta: PaginationObject
  sortedRaids: Raid[][]
}

const TeamsRoute: React.FC<Props> = (props: Props) => {
  // Set up router
  const router = useRouter()

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
    if (props.teams) {
      setTotalPages(props.meta.totalPages)
      setRecordCount(props.meta.count)
      replaceResults(props.meta.count, props.teams)
    }
    setCurrentPage(1)
  }, [])

  // Add scroll event listener for shadow on FilterBar on mount
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
        raid: raid ? raid.id : undefined,
        recency: recency !== -1 ? recency : undefined,
        page: currentPage,
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
    [currentPage, parties, element, raid, recency]
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
    fetchTeams({ replace: true })
  }, [element, raid, recency])

  // When the page changes, fetch all teams again.
  useDidMountEffect(() => {
    // Current page changed
    if (currentPage > 1) fetchTeams({ replace: false })
    else if (currentPage == 1) fetchTeams({ replace: true })
  }, [currentPage])

  // Receive filters from the filter bar
  function receiveFilters({
    element,
    raidSlug,
    recency,
  }: {
    element?: number
    raidSlug?: string
    recency?: number
  }) {
    if (element == 0) setElement(0, { shallow: true })
    else if (element) setElement(element, { shallow: true })

    if (raids && raidSlug) {
      const raid = raids.find((raid) => raid.slug === raidSlug)
      setRaid(raid)
      setRaidSlug(raidSlug, { shallow: true })
    }

    if (recency) setRecency(recency, { shallow: true })
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
          key={`party-${i}`}
          displayUser={true}
          onClick={goTo}
          onSave={toggleFavorite}
        />
      )
    })
  }

  return (
    <div id="Teams">
      <Head>
        {/* HTML */}
        <title>{t('page.titles.discover')}</title>
        <meta name="description" content={t('page.descriptions.discover')} />

        {/* OpenGraph */}
        <meta property="og:title" content={t('page.titles.discover')} />
        <meta
          property="og:description"
          content={t('page.descriptions.discover')}
        />
        <meta property="og:url" content="https://app.granblue.team/teams" />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="app.granblue.team" />
        <meta name="twitter:title" content={t('page.titles.discover')} />
        <meta
          name="twitter:description"
          content={t('page.descriptions.discover')}
        />
      </Head>

      <FilterBar
        onFilter={receiveFilters}
        scrolled={scrolled}
        element={element}
        raidSlug={raidSlug ? raidSlug : undefined}
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
  setUserToken(req, res)

  // Fetch and organize raids
  let { raids, sortedRaids } = await api.endpoints.raids
    .getAll()
    .then((response) => organizeRaids(response.data))

  // Create filter object
  const filters: FilterObject = extractFilters(query, raids)
  const params = {
    params: { ...filters },
  }

  // Set up empty variables
  let teams: Party[] | null = null
  let meta: PaginationObject = emptyPaginationObject

  // Fetch initial set of parties
  const response = await api.endpoints.parties.getAll(params)

  // Assign values to pass to props
  teams = response.data.results
  meta.count = response.data.meta.count
  meta.totalPages = response.data.meta.total_pages
  meta.perPage = response.data.meta.per_page

  return {
    props: {
      teams: teams,
      meta: meta,
      raids: raids,
      sortedRaids: sortedRaids,
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

export default TeamsRoute
