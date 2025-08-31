import { NextRequest, NextResponse } from 'next/server'
import { fetchFromApi } from '~/app/lib/api-utils'

// GET handler for fetching all jobs
export async function GET(request: NextRequest) {
  try {
    // Parse URL parameters
    const searchParams = request.nextUrl.searchParams
    const element = searchParams.get('element')
    
    // Build query parameters
    const queryParams: Record<string, string> = {}
    if (element) queryParams.element = element
    
    // Append query parameters
    let endpoint = '/jobs'
    const queryString = new URLSearchParams(queryParams).toString()
    if (queryString) {
      endpoint += `?${queryString}`
    }
    
    const data = await fetchFromApi(endpoint)
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching jobs', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: error.response?.status || 500 }
    )
  }
}