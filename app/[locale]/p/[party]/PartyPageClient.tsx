'use client'

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '~/i18n/navigation'

// Utils
import { appState } from '~/utils/appState'
import { GridType } from '~/utils/enums'

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
  const t = useTranslations('common')
  
  // State for tab management
  const [selectedTab, setSelectedTab] = useState<GridType>(GridType.Weapon)
  
  // Initialize raid groups
  useEffect(() => {
    if (raidGroups) {
      appState.raidGroups = raidGroups
    }
  }, [raidGroups])
  
  // Handle tab change
  const handleTabChanged = (value: string) => {
    const tabType = parseInt(value) as GridType
    setSelectedTab(tabType)
  }
  
  // Navigation helper (not used for existing parties but required by interface)
  const pushHistory = (path: string) => {
    router.push(path)
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
        team={party}
        selectedTab={selectedTab}
        raidGroups={raidGroups}
        handleTabChanged={handleTabChanged}
        pushHistory={pushHistory}
      />
      <PartyFooter party={party} />
    </>
  )
}

export default PartyPageClient
