import { NextRequest, NextResponse } from 'next/server'
import { fetchFromApi } from '~/app/lib/api-utils'

// GET handler for fetching skills for a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const data = await fetchFromApi(`/jobs/${id}/skills`)
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`Error fetching skills for job ${params.id}`, error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job skills' },
      { status: error.response?.status || 500 }
    )
  }
}