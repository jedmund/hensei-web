import axios from 'axios'
import ls, { get, set } from 'local-storage'
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

export const setEditKey = (id: string, user?: User) => {
  if (!user) {
    const edit_key = get<string>(id)
    axios.defaults.headers.common['X-Edit-Key'] = edit_key
  } else {
    unsetEditKey()
  }
}

export const unsetEditKey = () => {
  delete axios.defaults.headers.common['X-Edit-Key']
}
