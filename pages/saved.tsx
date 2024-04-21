// Libraries
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import InfiniteScroll from 'react-infinite-scroll-component'

// Hooks
import { useFavorites } from '~hooks/useFavorites'
import { useTeamFilter } from '~hooks/useTeamFilter'
import useDidMountEffect from '~hooks/useDidMountEffect'

// Utils
import fetchLatestVersion from '~utils/fetchLatestVersion'
import { appState } from '~utils/appState'
import { convertAdvancedFilters } from '~utils/convertAdvancedFilters'
import { CollectionPage } from '~utils/enums'
import { permissiveFilterset } from '~utils/defaultFilters'
import { setHeaders } from '~utils/userToken'
import {
  fetchRaidGroupsAndFilters,
  fetchSaved,
  parseAdvancedFilters,
} from '~utils/serverSideUtils'

// Types
import type { AxiosError } from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { PageContextObj, ResponseStatus } from '~types'

// Components
import ErrorSection from '~components/ErrorSection'
import FilterBar from '~components/filters/FilterBar'
import GridRep from '~components/reps/GridRep'
import GridRepCollection from '~components/reps/GridRepCollection'
import LoadingRep from '~components/reps/LoadingRep'
import SavedHead from '~components/head/SavedHead'

interface Props {
  context?: PageContextObj
  version: AppUpdate
  error: boolean
  status?: ResponseStatus
}

const SavedRoute: React.FC<Props> = ({
  context,
  version,
  error,
  status,
}: Props) => {
  // Set up router
  const router = useRouter()

  // Import translations
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
    fetchTeams,
    processTeams,
    setPagination,
  } = useTeamFilter(CollectionPage.Saved, context)

  const { toggleFavorite } = useFavorites(parties, setParties)

  // Set the initial parties from props
  useDidMountEffect(() => {
    if (context) {
      if (context.teams && context.pagination) {
        processTeams(context.teams, true)
        setPagination(context.pagination)

        appState.raidGroups = context.raidGroups
        appState.version = version
      }
    }

    setCurrentPage(1)
    setFetching(false)
  }, [context])

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
    return <SavedHead />
  }

  function pageError() {
    if (status) return <ErrorSection status={status} />
    else return <div />
  }

  // Page component rendering methods

  function renderParties() {
    return parties.map((party, i) => {
      return (
        <GridRep
          party={party}
          key={`party-${i}`}
          loading={isFetching}
          onClick={goTo}
          onSave={toggleFavorite}
        />
      )
    })
  }

  function renderLoading(number: number) {
    return (
      <GridRepCollection>
        {Array.from(Array(number)).map((x, i) => (
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
          defaultFilterset={permissiveFilterset}
          onFilter={receiveFilters}
          onAdvancedFilter={receiveAdvancedFilters}
          persistFilters={false}
          element={element}
          raid={raid}
          raidGroups={context.raidGroups}
          recency={recency}
        >
          <h1>{t('saved.title')}</h1>
        </FilterBar>

        <section>
          {renderInfiniteScroll}

          {parties.length == 0 ? (
            <div className="notFound">
              <h2>{t('saved.not_found')}</h2>
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

  try {
    // We don't pre-load advanced filters here
    const { raidGroups, filters } = await fetchRaidGroupsAndFilters(query)
    const { teams, pagination } = await fetchSaved(filters)

    return {
      props: {
        context: { teams, raidGroups, pagination },
        version,
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
          code: response ? response.status : -999,
          text: response ? response.statusText : 'unspecified_error',
        },
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  }
}
export default SavedRoute
