import { NextRequest, NextResponse } from 'next/server';
import { postToApi, revalidate } from '~/app/lib/api-utils';

// POST handler for remixing a party
export async function POST(
  request: NextRequest,
  { params }: { params: { shortcode: string } }
) {
  try {
    const { shortcode } = params;
    const body = await request.json();
    
    // Remix the party
    const response = await postToApi(`/parties/${shortcode}/remix`, body || {});
    
    // Revalidate the teams page since a new party was created
    revalidate('/teams');
    
    if (response.shortcode) {
      // Revalidate the new party page
      revalidate(`/p/${response.shortcode}`);
    }
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`Error remixing party with shortcode ${params.shortcode}`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to remix party' },
      { status: error.response?.status || 500 }
    );
  }
}