import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTeam, getRaidGroups } from '~/app/lib/data'
import PartyPageClient from './PartyPageClient'

// Dynamic metadata
export async function generateMetadata({
  params
}: {
  params: { party: string }
}): Promise<Metadata> {
  try {
    const partyData = await getTeam(params.party)
    
    // If no party or party doesn't exist, use default metadata
    if (!partyData || !partyData.party) {
      return {
        title: 'Party not found / granblue.team',
        description: 'This party could not be found or has been deleted'
      }
    }
    
    const party = partyData.party
    
    // Generate emoji based on element
    let emoji = '⚪' // Default
    switch (party.element) {
      case 1: emoji = '🟢'; break; // Wind
      case 2: emoji = '🔴'; break; // Fire
      case 3: emoji = '🔵'; break; // Water
      case 4: emoji = '🟤'; break; // Earth
      case 5: emoji = '🟣'; break; // Dark
      case 6: emoji = '🟡'; break; // Light
    }
    
    // Get team name and username
    const teamName = party.name || 'Untitled team'
    const username = party.user?.username || 'Anonymous'
    const raidName = party.raid?.name || ''
    
    return {
      title: `${emoji} ${teamName} by ${username} / granblue.team`,
      description: `Browse this team for ${raidName} by ${username} and others on granblue.team`
    }
  } catch (error) {
    return {
      title: 'Party not found / granblue.team',
      description: 'This party could not be found or has been deleted'
    }
  }
}

export default async function PartyPage({
  params
}: {
  params: { party: string }
}) {
  try {
    // Parallel fetch data with Promise.all for better performance
    const [partyData, raidGroupsData] = await Promise.all([
      getTeam(params.party),
      getRaidGroups()
    ])
    
    // If party doesn't exist, show 404
    if (!partyData || !partyData.party) {
      notFound()
    }
    
    return (
      <div className="party-page">
        <PartyPageClient 
          party={partyData.party}
          raidGroups={raidGroupsData.raid_groups || []}
        />
      </div>
    )
  } catch (error) {
    console.error(`Error fetching party data for ${params.party}:`, error)
    notFound()
  }
}