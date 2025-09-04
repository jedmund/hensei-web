import { NextRequest, NextResponse } from 'next/server'
import { fetchFromApi } from '~/app/lib/api-utils'

// Force dynamic rendering because fetchFromApi uses cookies
export const dynamic = 'force-dynamic'

// GET handler for fetching all job skills
export async function GET(request: NextRequest) {
  try {
    const data = await fetchFromApi('/jobs/skills')
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching job skills', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job skills' },
      { status: error.response?.status || 500 }
    )
  }
}