'use client'

import React, { useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/navigation'

// Utils
import { appState } from '~/utils/appState'

// Components
import Party from '~/components/party/Party'
import PartyFooter from '~/components/party/PartyFooter'
import ErrorSection from '~/components/ErrorSection'

interface Props {
  party: any; // Replace with proper Party type
  raidGroups: any[]; // Replace with proper RaidGroup type
}

const PartyPageClient: React.FC<Props> = ({ party, raidGroups }) => {
  const router = useRouter()
  const { t } = useTranslation('common')
  
  // Initialize app state
  useEffect(() => {
    if (party) {
      appState.parties[0] = party
      appState.raidGroups = raidGroups
    }
  }, [party, raidGroups])
  
  // Handle remix action
  async function handleRemix() {
    if (!party || !party.shortcode) return
    
    try {
      const response = await fetch(`/api/parties/${party.shortcode}/remix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data && data.shortcode) {
        // Navigate to the new remixed party
        router.push(`/p/${data.shortcode}`)
      }
    } catch (error) {
      console.error('Error remixing party', error)
    }
  }
  
  // Handle deletion action
  async function handleDelete() {
    if (!party || !party.shortcode) return
    
    try {
      await fetch(`/api/parties/${party.shortcode}`, {
        method: 'DELETE'
      })
      
      // Navigate to teams page after deletion
      router.push('/teams')
    } catch (error) {
      console.error('Error deleting party', error)
    }
  }
  
  // Error case
  if (!party) {
    return (
      <ErrorSection 
        status={{ 
          code: 404, 
          text: 'not_found' 
        }} 
      />
    )
  }
  
  return (
    <>
      <Party 
        party={party}
        onRemix={handleRemix}
        onDelete={handleDelete}
      />
      <PartyFooter party={party} />
    </>
  )
}

export default PartyPageClient