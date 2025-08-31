import { NextRequest, NextResponse } from 'next/server';
import { fetchFromApi } from '~/app/lib/api-utils';

// GET handler for fetching version info
export async function GET(request: NextRequest) {
  try {
    // Fetch version info
    const data = await fetchFromApi('/version');
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching version info', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch version info' },
      { status: error.response?.status || 500 }
    );
  }
}