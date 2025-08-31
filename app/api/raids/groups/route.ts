import { NextRequest, NextResponse } from 'next/server';
import { fetchFromApi } from '~/app/lib/api-utils';

// GET handler for fetching raid groups
export async function GET(request: NextRequest) {
  try {
    // Fetch raid groups
    const data = await fetchFromApi('/raids/groups');
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching raid groups', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch raid groups' },
      { status: error.response?.status || 500 }
    );
  }
}