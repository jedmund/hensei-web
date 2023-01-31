import axios from 'axios'
import { getCookie } from 'cookies-next'
import type { NextApiRequest, NextApiResponse } from 'next'

export const accountCookie = (
  req: NextApiRequest | undefined = undefined,
  res: NextApiResponse | undefined = undefined
) => {
  const options = req && res ? { req, res } : {}
  const cookie = getCookie('account', options)
  return cookie ? cookie : undefined
}

export const setHeaders = (
  req: NextApiRequest | undefined = undefined,
  res: NextApiResponse | undefined = undefined
) => {
  const cookie = accountCookie(req, res)
  if (cookie) {
    const parsed = JSON.parse(cookie as string)
    if (parsed.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`
  } else {
    delete axios.defaults.headers.common['Authorization']
  }
}
