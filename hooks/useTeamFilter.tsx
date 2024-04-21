// Libraries
import { useState, useCallback, useEffect } from 'react'
import { getCookie } from 'cookies-next'

// Hooks
import { useFetchTeams } from './useFetchTeams'
import { useFilterState } from './useFilterState'
import { usePaginationState } from './usePaginationState'
import useDidMountEffect from './useDidMountEffect'

// Utils
import { CollectionPage } from '~utils/enums'
import { convertAdvancedFilters } from '~utils/convertAdvancedFilters'
import { defaultFilterset } from '~utils/defaultFilters'

// Types
import type { PageContextObj, PaginationObject } from '~types'

export const useTeamFilter = (
  page: CollectionPage,
  context?: PageContextObj
) => {
  const [mounted, setMounted] = useState(false)
  const [parties, setParties] = useState<Party[]>([])

  function constructFilters({
    element,
    raid,
    recency,
    currentPage,
    filterSet,
  }: {
    element: number
    raid: string
    recency: number
    currentPage: number
    filterSet: FilterSet
  }) {
    const filters: { [key: string]: any } = {
      element: element !== -1 ? element : undefined,
      raid: raid === 'all' ? undefined : raid,
      recency: recency !== -1 ? recency : undefined,
      page: currentPage,
      ...convertAdvancedFilters(filterSet),
    }

    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    )

    return filters
  }

  const {
    element,
    setElement,
    raid,
    setRaid,
    recency,
    setRecency,
    advancedFilters,
    setAdvancedFilters,
  } = useFilterState(context)

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    recordCount,
    setRecordCount,
  } = usePaginationState()

  const {
    fetchTeams,
    fetchProfile,
    fetchSaved,
    processTeams,
    isLoading: isFetching,
    setIsLoading: setFetching,
    error: fetchError,
  } = useFetchTeams(
    currentPage,
    constructFilters({
      element,
      raid,
      recency,
      currentPage,
      filterSet: advancedFilters,
    }),
    parties,
    setParties,
    setTotalPages,
    setRecordCount
  )

  // Update the advancedFilters state based on cookies when the component mounts
  useEffect(() => {
    const filtersCookie = getCookie('filters')
    const filters = filtersCookie
      ? JSON.parse(filtersCookie as string)
      : defaultFilterset
    setAdvancedFilters(filters)
  }, [])

  // Handle pagination object updates from fetchTeams
  const setPagination = useCallback((value: PaginationObject) => {
    setTotalPages(value.totalPages)
    setRecordCount(value.count)
  }, [])

  useDidMountEffect(() => {}, [currentPage])

  useEffect(() => {
    if (context && context.teams && context.pagination) {
      setTotalPages(context.pagination.totalPages)
      setRecordCount(context.pagination.count)
      // processTeams(context.teams, context.pagination.count, true)
    }
    setCurrentPage(1)

    setFetching(false)
  }, [])

  // When the element, raid or recency filter changes,
  // fetch all teams again.
  useDidMountEffect(() => {
    setCurrentPage(1)

    if (mounted) fetch(true)

    setMounted(true)
  }, [element, raid, recency, advancedFilters])

  // When the page changes, fetch all teams again.
  useDidMountEffect(() => {
    if (currentPage > 1) fetch(false)
    else if (currentPage == 1 && mounted) fetch(true)

    setMounted(true)
  }, [currentPage])

  function fetch(replace: boolean) {
    switch (page) {
      case CollectionPage.Teams:
        return fetchTeams({ replace: replace })
      case CollectionPage.Profile:
        return fetchProfile({
          username: context?.user?.username,
          replace: replace,
        })
      case CollectionPage.Saved:
        return fetchSaved({
          replace: replace,
        })
    }
  }

  return {
    // Expose the states and setters for the component to use
    element,
    setElement,
    raid,
    setRaid,
    recency,
    setRecency,
    advancedFilters,
    setAdvancedFilters,
    parties,
    setParties,
    isFetching,
    setFetching,
    fetchError,
    fetchTeams,
    processTeams,
    currentPage,
    setCurrentPage,
    totalPages,
    recordCount,
    setPagination,
  }
}
