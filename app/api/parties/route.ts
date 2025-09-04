import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchFromApi, postToApi, PartySchema } from '~/app/lib/api-utils';

// Force dynamic rendering because we use searchParams and cookies
export const dynamic = 'force-dynamic';

// GET handler for fetching parties with filters
export async function GET(request: NextRequest) {
  try {
    // Parse URL parameters
    const searchParams = request.nextUrl.searchParams;
    const element = searchParams.get('element');
    const raid = searchParams.get('raid');
    const recency = searchParams.get('recency');
    const page = searchParams.get('page') || '1';
    const username = searchParams.get('username');

    // Build query parameters
    const queryParams: Record<string, string> = {};
    if (element) queryParams.element = element;
    if (raid) queryParams.raid_id = raid;
    if (recency) queryParams.recency = recency;
    if (page) queryParams.page = page;
    
    let endpoint = '/parties';
    
    // If username is provided, fetch that user's parties
    if (username) {
      endpoint = `/users/${username}/parties`;
    }
    
    // Append query parameters
    const queryString = new URLSearchParams(queryParams).toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
    
    const data = await fetchFromApi(endpoint);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching parties', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch parties' },
      { status: error.response?.status || 500 }
    );
  }
}

// Validate party data
const CreatePartySchema = PartySchema.extend({
  element: z.number().min(1).max(6),
  raid_id: z.string().optional(),
});

// POST handler for creating a new party
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreatePartySchema.parse(body.party);
    
    const response = await postToApi('/parties', { 
      party: validatedData 
    });
    
    return NextResponse.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create party' },
      { status: error.response?.status || 500 }
    );
  }
}