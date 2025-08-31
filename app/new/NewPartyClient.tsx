'use client'

import React, { useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/navigation'

// Components
import NewHead from '~/components/head/NewHead'
import Party from '~/components/party/Party'
import ErrorSection from '~/components/ErrorSection'

// Utils
import { appState, initialAppState } from '~/utils/appState'
import { accountState } from '~/utils/accountState'
import clonedeep from 'lodash.clonedeep'

interface Props {
  raidGroups: any[]; // Replace with proper RaidGroup type
  error?: boolean;
}

const NewPartyClient: React.FC<Props> = ({ 
  raidGroups,
  error = false
}) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  
  // Initialize app state for a new party
  useEffect(() => {
    // Reset app state for new party
    const resetState = clonedeep(initialAppState)
    Object.keys(resetState).forEach((key) => {
      appState[key] = resetState[key]
    })
    
    // Initialize raid groups
    if (raidGroups.length > 0) {
      appState.raidGroups = raidGroups
    }
  }, [raidGroups])
  
  // Handle save action
  async function handleSave(shouldNavigate = true) {
    try {
      // Prepare party data
      const party = {
        name: appState.parties[0]?.name || '',
        description: appState.parties[0]?.description || '',
        visibility: appState.parties[0]?.visibility || 'public',
        element: appState.parties[0]?.element || 1, // Default to Wind
        raid_id: appState.parties[0]?.raid?.id
      }
      
      // Save the party
      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ party })
      })
      
      const data = await response.json()
      
      if (data && data.shortcode && shouldNavigate) {
        // Navigate to the new party page
        router.push(`/p/${data.shortcode}`)
      }
      
      return data
    } catch (error) {
      console.error('Error saving party', error)
      return null
    }
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
      <NewHead />
      <Party 
        party={appState.parties[0] || { name: t('new_party'), element: 1 }}
        isNew={true}
        onSave={handleSave}
      />
    </>
  )
}

export default NewPartyClient