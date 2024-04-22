// Libraries
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import axios, { AxiosResponse } from 'axios'
import InfiniteScroll from 'react-infinite-scroll-component'

// Hooks
import { useFavorites } from '~hooks/useFavorites'
import { useTeamFilter } from '~hooks/useTeamFilter'

// Utils
import fetchLatestVersion from '~utils/fetchLatestVersion'
import { appState } from '~utils/appState'
import { defaultFilterset } from '~utils/defaultFilters'
import { setHeaders } from '~utils/userToken'
import { fetchRaidGroups } from '~utils/serverSideUtils'

// Types
import type { NextApiRequest, NextApiResponse } from 'next'
import type { PageContextObj, ResponseStatus } from '~types'

// Components
import ErrorSection from '~components/ErrorSection'
import FilterBar from '~components/filters/FilterBar'
import GridRep from '~components/reps/GridRep'
import GridRepCollection from '~components/reps/GridRepCollection'
import LoadingRep from '~components/reps/LoadingRep'
import TeamsHead from '~components/head/TeamsHead'
import { CollectionPage } from '~utils/enums'

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
  const router = useRouter()
  const { t } = useTranslation('common')

  const [raids, setRaids] = useState<Raid[]>()

  const {
    element,
    setElement,
    raid,
    setRaid,
    recency,
    setRecency,
    advancedFilters,
    setAdvancedFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    recordCount,
    parties,
    setParties,
    isFetching,
    setFetching,
    fetchError,
    fetch,
    processTeams,
    setPagination,
  } = useTeamFilter(CollectionPage.Teams, context)

  const { toggleFavorite } = useFavorites(parties, setParties)

  // Set the initial parties from props
  useEffect(() => {
    if (context) {
      fetch(true)

      appState.raidGroups = context.raidGroups
      appState.version = version
    }

    setCurrentPage(1)
    setFetching(false)
  }, [])

  // Fetch all raids on mount, then find the raid in the URL if present
  useEffect(() => {
    const raids = appState.raidGroups.flatMap((group) => group.raids)
    setRaids(raids)
  }, [setRaids])

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

  // Methods: Navigation

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

  // Page component rendering methods
  function renderParties() {
    return parties.map((party, i) => (
      <GridRep
        party={party}
        key={`party-${i}`}
        loading={isFetching}
        onClick={() => goTo(party.shortcode)}
        onSave={(teamId, favorited) => toggleFavorite(teamId, favorited)}
      />
    ))
  }

  function renderLoading(number: number) {
    return (
      <GridRepCollection>
        {Array.from({ length: number }, (_, i) => (
          <LoadingRep key={`loading-${i}`} />
        ))}
      </GridRepCollection>
    )
  }

  const renderInfiniteScroll = (
    <InfiniteScroll
      dataLength={parties && parties.length > 0 ? parties.length : 0}
      next={() => setCurrentPage(currentPage + 1)}
      hasMore={totalPages > currentPage}
      loader={renderLoading(3)}
    >
      <GridRepCollection>{renderParties()}</GridRepCollection>
    </InfiniteScroll>
  )

  if (context) {
    return (
      <div className="teams">
        {pageHead()}
        <FilterBar
          defaultFilterset={defaultFilterset}
          onFilter={receiveFilters}
          onAdvancedFilter={receiveAdvancedFilters}
          persistFilters={true}
          element={element}
          raid={raid}
          raidGroups={context.raidGroups}
          recency={recency}
        >
          <h1>{t('teams.title')}</h1>
        </FilterBar>

        <section>{renderInfiniteScroll}</section>
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

  try {
    const raidGroups = await fetchRaidGroups()

    return {
      props: {
        context: { raidGroups },
        version,
        error: false,
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  } catch (error) {
    // If error is of type AxiosError, extract the response into a variable
    let response: AxiosResponse<any, any> | undefined = axios.isAxiosError(error)
      ? error.response
      : undefined
    
    return {
      props: {
        context: null,
        error: true,
        status: {
          code: response?.status ?? -999,
          text: response?.statusText ?? 'unspecified_error',
        },
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  }
}

export default TeamsRoute
