import { useState, useEffect } from 'react'
import { getCookie } from 'cookies-next'
import { useQueryState } from 'nuqs'

import { defaultFilterset } from '~utils/defaultFilters'
import { parseElement, serializeElement } from '~utils/parseElement'

import type { PageContextObj } from '~types'

export const useFilterState = (context?: PageContextObj) => {
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

  const [advancedFilters, setAdvancedFilters] = useState(defaultFilterset)

  useEffect(() => {
    const filtersCookie = getCookie('filters')
    const filters = filtersCookie
      ? JSON.parse(filtersCookie as string)
      : defaultFilterset
    setAdvancedFilters(filters)
  }, [])

  return {
    element,
    setElement,
    raid,
    setRaid,
    recency,
    setRecency,
    advancedFilters,
    setAdvancedFilters,
  }
}
