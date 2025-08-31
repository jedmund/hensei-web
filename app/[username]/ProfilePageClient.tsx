'use client'

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter, useSearchParams } from 'next/navigation'
import InfiniteScroll from 'react-infinite-scroll-component'

// Components
import FilterBar from '~/components/filters/FilterBar'
import ProfileHead from '~/components/head/ProfileHead'
import GridRep from '~/components/reps/GridRep'
import GridRepCollection from '~/components/reps/GridRepCollection'
import LoadingRep from '~/components/reps/LoadingRep'
import UserInfo from '~/components/filters/UserInfo'

// Utils
import { defaultFilterset } from '~/utils/defaultFilters'
import { appState } from '~/utils/appState'

// Types
interface Pagination {
  current_page: number;
  total_pages: number;
  record_count: number;
}

interface Party {
  id: string;
  shortcode: string;
  name: string;
  element: number;
  // Add other properties as needed
}

interface User {
  id: string;
  username: string;
  avatar: {
    picture: string;
    element: string;
  };
  gender: string;
  // Add other properties as needed
}

interface Props {
  initialData: {
    user: User;
    teams: Party[];
    raidGroups: any[];
    pagination: Pagination;
  };
  initialElement?: number;
  initialRaid?: string;
  initialRecency?: string;
}

const ProfilePageClient: React.FC<Props> = ({ 
  initialData, 
  initialElement,
  initialRaid,
  initialRecency
}) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State management
  const [parties, setParties] = useState<Party[]>(initialData.teams)
  const [currentPage, setCurrentPage] = useState(initialData.pagination.current_page)
  const [totalPages, setTotalPages] = useState(initialData.pagination.total_pages)
  const [recordCount, setRecordCount] = useState(initialData.pagination.record_count)
  const [loaded, setLoaded] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [element, setElement] = useState(initialElement || 0)
  const [raid, setRaid] = useState(initialRaid || '')
  const [recency, setRecency] = useState(initialRecency || '')
  
  // Initialize app state with raid groups
  useEffect(() => {
    if (initialData.raidGroups.length > 0) {
      appState.raidGroups = initialData.raidGroups
    }
  }, [initialData.raidGroups])
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update or remove parameters based on filter values
    if (element) {
      params.set('element', element.toString())
    } else {
      params.delete('element')
    }
    
    if (raid) {
      params.set('raid', raid)
    } else {
      params.delete('raid')
    }
    
    if (recency) {
      params.set('recency', recency)
    } else {
      params.delete('recency')
    }
    
    // Only update URL if filters are changed
    const newQueryString = params.toString()
    const currentQuery = searchParams.toString()
    
    if (newQueryString !== currentQuery) {
      router.push(`/${initialData.user.username}${newQueryString ? `?${newQueryString}` : ''}`)
    }
  }, [element, raid, recency, router, searchParams, initialData.user.username])
  
  // Load more parties when scrolling
  async function loadMoreParties() {
    if (fetching || currentPage >= totalPages) return
    
    setFetching(true)
    
    try {
      // Construct URL for fetching more data
      const url = new URL(`/api/parties`, window.location.origin)
      url.searchParams.set('username', initialData.user.username)
      url.searchParams.set('page', (currentPage + 1).toString())
      
      if (element) url.searchParams.set('element', element.toString())
      if (raid) url.searchParams.set('raid', raid)
      if (recency) url.searchParams.set('recency', recency)
      
      const response = await fetch(url.toString())
      const data = await response.json()
      
      if (data.parties && Array.isArray(data.parties)) {
        setParties([...parties, ...data.parties])
        setCurrentPage(data.pagination?.current_page || currentPage + 1)
        setTotalPages(data.pagination?.total_pages || totalPages)
        setRecordCount(data.pagination?.record_count || recordCount)
      }
    } catch (error) {
      console.error('Error loading more parties', error)
    } finally {
      setFetching(false)
    }
  }
  
  // Receive filters from the filter bar
  function receiveFilters(filters: FilterSet) {
    if ('element' in filters) {
      setElement(filters.element || 0)
    }
    if ('recency' in filters) {
      setRecency(filters.recency || '')
    }
    if ('raid' in filters) {
      setRaid(filters.raid || '')
    }
    
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }
  
  // Methods: Navigation
  function goToParty(shortcode: string) {
    router.push(`/p/${shortcode}`)
  }
  
  // Page component rendering methods
  function renderParties() {
    return parties.map((party, i) => (
      <GridRep
        party={party}
        key={`party-${i}`}
        loading={fetching}
        onClick={() => goToParty(party.shortcode)}
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
    <>
      {parties.length === 0 && !loaded && renderLoading(3)}
      {parties.length === 0 && loaded && (
        <div className="notFound">
          <h2>{t('teams.not_found')}</h2>
        </div>
      )}
      {parties.length > 0 && (
        <InfiniteScroll
          dataLength={parties.length}
          next={loadMoreParties}
          hasMore={totalPages > currentPage}
          loader={renderLoading(3)}
        >
          <GridRepCollection>{renderParties()}</GridRepCollection>
        </InfiniteScroll>
      )}
    </>
  )
  
  return (
    <>
      <ProfileHead username={initialData.user.username} />
      
      <FilterBar
        defaultFilterset={defaultFilterset}
        onFilter={receiveFilters}
        persistFilters={false}
        element={element}
        raid={raid}
        raidGroups={initialData.raidGroups}
        recency={recency}
      >
        <UserInfo 
          name={initialData.user.username}
          picture={initialData.user.avatar.picture}
          element={initialData.user.avatar.element}
          gender={initialData.user.gender}
        />
      </FilterBar>
      
      <section>{renderInfiniteScroll}</section>
    </>
  )
}

export default ProfilePageClient