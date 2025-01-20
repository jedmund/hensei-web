import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { shortcode } = req.query

  if (!shortcode || Array.isArray(shortcode)) {
    return res.status(400).json({ error: 'Invalid shortcode' })
  }

  try {
    const response = await axios({
      method: 'GET',
      url: `${process.env.API_URL}/api/v1/parties/${shortcode}/preview`,
      responseType: 'arraybuffer',
      headers: {
        Accept: 'image/png',
      },
    })

    // Set correct content type and caching headers
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    return res.send(response.data)
  } catch (error) {
    console.error('Error fetching preview:', error)
    return res.status(500).json({ error: 'Failed to fetch preview' })
  }
}
