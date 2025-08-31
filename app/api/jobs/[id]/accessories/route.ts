import { NextRequest, NextResponse } from 'next/server'
import { fetchFromApi } from '~/app/lib/api-utils'

// GET handler for fetching accessories for a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const data = await fetchFromApi(`/jobs/${id}/accessories`)
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`Error fetching accessories for job ${params.id}`, error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job accessories' },
      { status: error.response?.status || 500 }
    )
  }
}