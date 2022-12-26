import { YoutubeAPIClient } from 'youtube-api-v3-wrapper'

export const youtube = new YoutubeAPIClient(
  'key',
  process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ? ''
)
