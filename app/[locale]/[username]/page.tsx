import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getUserProfile, getRaidGroups } from '~/app/lib/data'
import ProfilePageClient from './ProfilePageClient'

// Dynamic metadata
export async function generateMetadata({
  params
}: {
  params: { username: string }
}): Promise<Metadata> {
  try {
    const userProfileData = await getUserProfile(params.username, { page: 1 })
    
    // If user doesn't exist, use default metadata
    if (!userProfileData || !userProfileData.profile) {
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
    const [userProfileData, raidGroupsData] = await Promise.all([
      getUserProfile(params.username, { element, raid, recency, page }),
      getRaidGroups()
    ])
    
    // If user doesn't exist, show 404
    if (!userProfileData || !userProfileData.profile) {
      notFound()
    }
    
    // Extract user and teams from the profile response
    const user = userProfileData.profile
    const teams = userProfileData.profile.parties || []
    
    const initialData = {
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        gender: user.gender
      },
      teams: teams,
      raidGroups: raidGroupsData || [],
      pagination: {
        current_page: page,
        total_pages: userProfileData.meta?.total_pages || 1,
        record_count: userProfileData.meta?.count || 0
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