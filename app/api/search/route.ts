import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { postToApi } from '~/app/lib/api-utils'

// Validate the search request
const SearchAllSchema = z.object({
  search: z.object({
    query: z.string().min(1, 'Search query is required'),
    exclude: z.array(z.string()).optional(),
    locale: z.string().default('en')
  })
})

// POST handler for searching across all types
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = SearchAllSchema.parse(body)
    
    // Perform search
    const response = await postToApi('/search', validatedData)
    
    return NextResponse.json(response)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error searching', error)
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: error.response?.status || 500 }
    )
  }
}