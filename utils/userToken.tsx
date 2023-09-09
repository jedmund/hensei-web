import axios from 'axios'
import ls, { get, set } from 'local-storage'
import { getCookie } from 'cookies-next'
import type { NextApiRequest, NextApiResponse } from 'next'

export const retrieveCookie = (
  name: string,
  req: NextApiRequest | undefined = undefined,
  res: NextApiResponse | undefined = undefined
) => {
  const options = req && res ? { req, res } : {}
  const cookie = getCookie(name, options)
  return cookie ? cookie : undefined
}

export const setHeaders = (
  req: NextApiRequest | undefined = undefined,
  res: NextApiResponse | undefined = undefined
) => {
  const accountCookie = retrieveCookie('account', req, res)
  const userCookie = retrieveCookie('user', req, res)

  if (accountCookie && userCookie) {
    const account = JSON.parse(accountCookie as string)
    const user = JSON.parse(userCookie as string)

    if (account.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${account.token}`

    if (account.role === 9 && user.bahamut)
      axios.defaults.headers.common['X-Admin-Mode'] = 'true'
    else {
      delete axios.defaults.headers.common['X-Admin-Mode']
    }
  } else {
    delete axios.defaults.headers.common['Authorization']
    delete axios.defaults.headers.common['X-Admin-Mode']
  }
}

export const storeEditKey = (id: string, key: string) => {
  ls(id, key)
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
