import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchFromApi, putToApi, deleteFromApi, revalidate, PartySchema } from '~/app/lib/api-utils';

// Force dynamic rendering because fetchFromApi uses cookies
export const dynamic = 'force-dynamic';

// GET handler for fetching a single party by shortcode
export async function GET(
  request: NextRequest, 
  { params }: { params: { shortcode: string } }
) {
  try {
    const { shortcode } = params;
    
    // Fetch party data
    const data = await fetchFromApi(`/parties/${shortcode}`);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Error fetching party with shortcode ${params.shortcode}`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch party' },
      { status: error.response?.status || 500 }
    );
  }
}

// Update party schema
const UpdatePartySchema = PartySchema.extend({
  id: z.string().optional(),
  shortcode: z.string().optional(),
});

// PUT handler for updating a party
export async function PUT(
  request: NextRequest,
  { params }: { params: { shortcode: string } }
) {
  try {
    const { shortcode } = params;
    const body = await request.json();
    
    // Validate the request body
    const validatedData = UpdatePartySchema.parse(body.party);
    
    // Update the party
    const response = await putToApi(`/parties/${shortcode}`, {
      party: validatedData
    });
    
    // Revalidate the party page
    revalidate(`/p/${shortcode}`);
    
    return NextResponse.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update party' },
      { status: error.response?.status || 500 }
    );
  }
}

// DELETE handler for deleting a party
export async function DELETE(
  request: NextRequest,
  { params }: { params: { shortcode: string } }
) {
  try {
    const { shortcode } = params;
    
    // Delete the party
    const response = await deleteFromApi(`/parties/${shortcode}`);
    
    // Revalidate related pages
    revalidate(`/teams`);
    
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete party' },
      { status: error.response?.status || 500 }
    );
  }
}