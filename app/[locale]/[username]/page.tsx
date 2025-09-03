import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getUserInfo, getTeams, getRaidGroups } from '~/app/lib/data'
import ProfilePageClient from './ProfilePageClient'

// Dynamic metadata
export async function generateMetadata({
  params
}: {
  params: { username: string }
}): Promise<Metadata> {
  try {
    const userData = await getUserInfo(params.username)
    
    // If user doesn't exist, use default metadata
    if (!userData || !userData.user) {
      return {
        title: 'User not found / granblue.team',
        description: 'This user could not be found'
      }
    }
    
    return {
      title: `@${params.username}'s Teams / granblue.team`,
      description: `Browse @${params.username}'s Teams and filter by raid, element or recency`
    }
  } catch (error) {
    return {
      title: 'User not found / granblue.team',
      description: 'This user could not be found'
    }
  }
}

export default async function ProfilePage({
  params,
  searchParams
}: {
  params: { username: string };
  searchParams: { element?: string; raid?: string; recency?: string; page?: string }
}) {
  try {
    // Extract query parameters with type safety
    const element = searchParams.element ? parseInt(searchParams.element, 10) : undefined;
    const raid = searchParams.raid;
    const recency = searchParams.recency;
    const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
    
    // Parallel fetch data with Promise.all for better performance
    const [userData, teamsData, raidGroupsData] = await Promise.all([
      getUserInfo(params.username),
      getTeams({ username: params.username, element, raid, recency, page }),
      getRaidGroups()
    ])
    
    // If user doesn't exist, show 404
    if (!userData || !userData.user) {
      notFound()
    }
    
    // Prepare data for client component
    const initialData = {
      user: userData.user,
      teams: teamsData.parties || [],
      raidGroups: raidGroupsData.raid_groups || [],
      pagination: {
        current_page: teamsData.pagination?.current_page || 1,
        total_pages: teamsData.pagination?.total_pages || 1,
        record_count: teamsData.pagination?.record_count || 0
      }
    }
    
    return (
      <div className="profile-page">
        <ProfilePageClient 
          initialData={initialData}
          initialElement={element}
          initialRaid={raid}
          initialRecency={recency}
        />
      </div>
    )
  } catch (error) {
    console.error(`Error fetching profile data for ${params.username}:`, error)
    notFound()
  }
}