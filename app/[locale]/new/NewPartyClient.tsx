'use client'

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '~/i18n/navigation'
import dynamic from 'next/dynamic'

// Components
import Party from '~/components/party/Party'
import ErrorSection from '~/components/ErrorSection'

// Utils
import { appState, initialAppState } from '~/utils/appState'
import { accountState } from '~/utils/accountState'
import clonedeep from 'lodash.clonedeep'
import { GridType } from '~/utils/enums'

interface Props {
  raidGroups: any[]; // Replace with proper RaidGroup type
  error?: boolean;
}

const NewPartyClient: React.FC<Props> = ({ 
  raidGroups,
  error = false
}) => {
  const t = useTranslations('common')
  const router = useRouter()
  
  // State for tab management
  const [selectedTab, setSelectedTab] = useState<GridType>(GridType.Weapon)
  
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
  
  // Handle tab change
  const handleTabChanged = (value: string) => {
    const tabType = parseInt(value) as GridType
    setSelectedTab(tabType)
  }
  
  // Navigation helper for Party component
  const pushHistory = (path: string) => {
    router.push(path)
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
  
  // Temporarily use wrapper to debug
  const PartyWrapper = dynamic(() => import('./PartyWrapper'), {
    ssr: false,
    loading: () => <div>Loading...</div>
  })
  
  return <PartyWrapper raidGroups={raidGroups} />
}

export default NewPartyClient
