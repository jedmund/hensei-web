import { Metadata } from 'next'
import React from 'react'
import { getTeams as fetchTeams, getRaidGroups } from '~/app/lib/data'
import TeamsPageClient from './TeamsPageClient'

// Metadata
export const metadata: Metadata = {
  title: 'Discover teams / granblue.team',
  description: 'Save and discover teams to use in Granblue Fantasy and search by raid, element or recency',
}

export default async function TeamsPage({
  searchParams
}: {
  searchParams: { element?: string; raid?: string; recency?: string; page?: string }
}) {
  try {
    // Extract query parameters with type safety
    const element = searchParams.element ? parseInt(searchParams.element, 10) : undefined;
    const raid = searchParams.raid;
    const recency = searchParams.recency;
    const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
    
    // Parallel fetch data with Promise.all for better performance
    const [teamsData, raidGroupsData] = await Promise.all([
      fetchTeams({ element, raid, recency, page }),
      getRaidGroups()
    ]);
    
    // Prepare data for client component
    const initialData = {
      teams: teamsData.parties || [],
      raidGroups: raidGroupsData.raid_groups || [],
      pagination: {
        current_page: teamsData.pagination?.current_page || 1,
        total_pages: teamsData.pagination?.total_pages || 1,
        record_count: teamsData.pagination?.record_count || 0
      }
    };
    
    return (
      <div className="teams">
        {/* Pass server data to client component */}
        <TeamsPageClient 
          initialData={initialData}
          initialElement={element}
          initialRaid={raid}
          initialRecency={recency} 
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching teams data:", error);
    
    // Fallback data for error case
    return (
      <div className="teams">
        <TeamsPageClient 
          initialData={{ teams: [], raidGroups: [], pagination: { current_page: 1, total_pages: 1, record_count: 0 } }}
          error={true} 
        />
      </div>
    );
  }
}