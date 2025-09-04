import { NextRequest, NextResponse } from 'next/server';
import { fetchFromApi } from '~/app/lib/api-utils';

// GET handler for fetching a single character
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Character ID is required' },
        { status: 400 }
      );
    }
    
    const data = await fetchFromApi(`/characters/${id}`);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Error fetching character ${params.id}`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch character' },
      { status: error.response?.status || 500 }
    );
  }
}