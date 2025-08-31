import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getFavorites, getRaidGroups } from '~/app/lib/data'
import SavedPageClient from './SavedPageClient'

// Metadata
export const metadata: Metadata = {
  title: 'Your saved teams / granblue.team',
  description: 'View and manage the teams you have saved to your account'
}

// Check if user is logged in server-side
function isAuthenticated() {
  const cookieStore = cookies()
  const accountCookie = cookieStore.get('account')
  
  if (accountCookie) {
    try {
      const accountData = JSON.parse(accountCookie.value)
      return accountData.token ? true : false
    } catch (e) {
      return false
    }
  }
  
  return false
}

export default async function SavedPage({
  searchParams
}: {
  searchParams: { element?: string; raid?: string; recency?: string; page?: string }
}) {
  // Redirect to teams page if not logged in
  if (!isAuthenticated()) {
    redirect('/teams')
  }

  try {
    // Extract query parameters with type safety
    const element = searchParams.element ? parseInt(searchParams.element, 10) : undefined;
    const raid = searchParams.raid;
    const recency = searchParams.recency;
    
    // Parallel fetch data with Promise.all for better performance
    const [savedTeamsData, raidGroupsData] = await Promise.all([
      getFavorites(),
      getRaidGroups()
    ])
    
    // Filter teams by element/raid if needed
    let filteredTeams = savedTeamsData.parties || [];
    
    if (element) {
      filteredTeams = filteredTeams.filter(party => party.element === element)
    }
    
    if (raid) {
      filteredTeams = filteredTeams.filter(party => party.raid?.id === raid)
    }
    
    // Prepare data for client component
    const initialData = {
      teams: filteredTeams,
      raidGroups: raidGroupsData.raid_groups || [],
      totalCount: savedTeamsData.parties?.length || 0
    }
    
    return (
      <div className="saved-page">
        <SavedPageClient 
          initialData={initialData}
          initialElement={element}
          initialRaid={raid}
          initialRecency={recency}
        />
      </div>
    )
  } catch (error) {
    console.error("Error fetching saved teams:", error)
    
    // Provide empty data for error case
    return (
      <div className="saved-page">
        <SavedPageClient 
          initialData={{ teams: [], raidGroups: [], totalCount: 0 }}
          error={true}
        />
      </div>
    )
  }
}