'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { GridType } from '~/utils/enums'

// Dynamically import Party to isolate the error
const Party = dynamic(() => import('~/components/party/Party'), {
  ssr: false,
  loading: () => <div>Loading Party component...</div>
})

interface Props {
  raidGroups: any[]
}

export default function PartyWrapper({ raidGroups }: Props) {
  const [selectedTab, setSelectedTab] = React.useState<GridType>(GridType.Weapon)
  
  const handleTabChanged = (value: string) => {
    const tabType = parseInt(value) as GridType
    setSelectedTab(tabType)
  }
  
  const pushHistory = (path: string) => {
    console.log('Navigation to:', path)
  }
  
  try {
    return (
      <Party 
        new={true}
        selectedTab={selectedTab}
        raidGroups={raidGroups}
        handleTabChanged={handleTabChanged}
        pushHistory={pushHistory}
      />
    )
  } catch (error) {
    console.error('Error rendering Party:', error)
    return (
      <div>
        <h2>Error loading Party component</h2>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }
}