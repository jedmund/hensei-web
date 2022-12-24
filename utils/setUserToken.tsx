import axios from 'axios'
import { getCookie } from 'cookies-next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default (
  req: NextApiRequest | undefined = undefined,
  res: NextApiResponse | undefined = undefined
) => {
  // Set up cookies
  const options = req && res ? { req, res } : {}
  const cookie = getCookie('account', options)
  if (cookie) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${
      JSON.parse(cookie as string).token
    }`
  } else {
    delete axios.defaults.headers.common['Authorization']
  }
}
