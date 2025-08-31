import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { postToApi, SearchSchema } from '~/app/lib/api-utils';

// Validate the object type
const ObjectTypeSchema = z.enum(['characters', 'weapons', 'summons', 'job_skills']);

// POST handler for search
export async function POST(
  request: NextRequest,
  { params }: { params: { object: string } }
) {
  try {
    const { object } = params;
    
    // Validate object type
    const validObjectType = ObjectTypeSchema.safeParse(object);
    if (!validObjectType.success) {
      return NextResponse.json(
        { error: `Invalid object type: ${object}` },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate search parameters
    const validatedSearch = SearchSchema.parse(body.search);
    
    // Perform search
    const response = await postToApi(`/search/${object}`, {
      search: validatedSearch
    });
    
    return NextResponse.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error(`Error searching ${params.object}`, error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: error.response?.status || 500 }
    );
  }
}