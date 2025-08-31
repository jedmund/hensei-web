import { NextRequest, NextResponse } from 'next/server';
import { fetchFromApi } from '~/app/lib/api-utils';

// GET handler for fetching user info
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    
    // Fetch user info
    const data = await fetchFromApi(`/users/info/${username}`);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Error fetching user info for ${params.username}`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user info' },
      { status: error.response?.status || 500 }
    );
  }
}