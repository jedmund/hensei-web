import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchFromApi, postToApi, deleteFromApi } from '~/app/lib/api-utils';

// Schema for favorite request
const FavoriteSchema = z.object({
  favorite: z.object({
    party_id: z.string()
  })
});

// GET handler for fetching user's favorites
export async function GET(request: NextRequest) {
  try {
    // Get saved teams/favorites
    const data = await fetchFromApi('/parties/favorites');
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching favorites', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch favorites' },
      { status: error.response?.status || 500 }
    );
  }
}

// POST handler for adding a favorite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedData = FavoriteSchema.parse(body);
    
    // Save the favorite
    const response = await postToApi('/favorites', validatedData);
    
    return NextResponse.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error saving favorite', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save favorite' },
      { status: error.response?.status || 500 }
    );
  }
}

// DELETE handler for removing a favorite
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedData = FavoriteSchema.parse(body);
    
    // Delete the favorite
    const response = await deleteFromApi('/favorites', validatedData);
    
    return NextResponse.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error removing favorite', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove favorite' },
      { status: error.response?.status || 500 }
    );
  }
}