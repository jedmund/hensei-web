import { Metadata } from 'next'
import { getRaidGroups } from '~/app/lib/data'
import NewPartyClient from './NewPartyClient'

// Metadata
export const metadata: Metadata = {
  title: 'Create a new team / granblue.team',
  description: 'Create and theorycraft teams to use in Granblue Fantasy and share with the community',
}

export default async function NewPartyPage() {
  try {
    // Fetch raid groups for the party creation
    const raidGroupsData = await getRaidGroups()
    
    return (
      <div className="new-party-page">
        <NewPartyClient 
          raidGroups={raidGroupsData.raid_groups || []}
        />
      </div>
    )
  } catch (error) {
    console.error("Error fetching data for new party page:", error)
    
    // Provide empty data for error case
    return (
      <div className="new-party-page">
        <NewPartyClient 
          raidGroups={[]}
          error={true}
        />
      </div>
    )
  }
}