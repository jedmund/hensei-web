'use client'

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter, useSearchParams } from 'next/navigation'

// Components
import FilterBar from '~/components/filters/FilterBar'
import GridRep from '~/components/reps/GridRep'
import GridRepCollection from '~/components/reps/GridRepCollection'
import LoadingRep from '~/components/reps/LoadingRep'
import ErrorSection from '~/components/ErrorSection'

// Utils
import { defaultFilterset } from '~/utils/defaultFilters'
import { appState } from '~/utils/appState'

// Types
interface Party {
  id: string;
  shortcode: string;
  name: string;
  element: number;
  // Add other properties as needed
}

interface Props {
  initialData: {
    teams: Party[];
    raidGroups: any[];
    totalCount: number;
  };
  initialElement?: number;
  initialRaid?: string;
  initialRecency?: string;
  error?: boolean;
}

const SavedPageClient: React.FC<Props> = ({ 
  initialData, 
  initialElement,
  initialRaid,
  initialRecency,
  error = false
}) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State management
  const [parties, setParties] = useState<Party[]>(initialData.teams)
  const [element, setElement] = useState(initialElement || 0)
  const [raid, setRaid] = useState(initialRaid || '')
  const [recency, setRecency] = useState(initialRecency || '')
  const [fetching, setFetching] = useState(false)
  
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
      router.push(`/saved${newQueryString ? `?${newQueryString}` : ''}`)
    }
  }, [element, raid, recency, router, searchParams])
  
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
  }
  
  // Handle favorite toggle
  async function toggleFavorite(teamId: string, favorited: boolean) {
    if (fetching) return
    
    setFetching(true)
    
    try {
      const method = favorited ? 'POST' : 'DELETE'
      const body = { favorite: { party_id: teamId } }
      
      await fetch('/api/favorites', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      
      // Update local state by removing the team if unfavorited
      if (!favorited) {
        setParties(parties.filter(party => party.id !== teamId))
      }
    } catch (error) {
      console.error('Error toggling favorite', error)
    } finally {
      setFetching(false)
    }
  }
  
  // Navigation to party page
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
  
  if (error) {
    return (
      <ErrorSection 
        status={{ 
          code: 500, 
          text: 'internal_server_error' 
        }} 
      />
    )
  }
  
  return (
    <>
      <FilterBar
        defaultFilterset={defaultFilterset}
        onFilter={receiveFilters}
        persistFilters={false}
        element={element}
        raid={raid}
        raidGroups={initialData.raidGroups}
        recency={recency}
      >
        <h1>{t('saved.title')}</h1>
      </FilterBar>
      
      <section>
        {parties.length === 0 ? (
          <div className="notFound">
            <h2>{t('saved.not_found')}</h2>
          </div>
        ) : (
          <GridRepCollection>{renderParties()}</GridRepCollection>
        )}
      </section>
    </>
  )
}

export default SavedPageClient