import { accountCookie } from './userToken'
import { v4 as uuidv4 } from 'uuid'
import { setCookie } from 'cookies-next'
import type { NextApiRequest, NextApiResponse } from 'next'

export const createLocalId = (
  req: NextApiRequest | undefined = undefined,
  res: NextApiResponse | undefined = undefined
) => {
  // If there is no account entry in cookies, create a UUID and store it
  if (!accountCookie(req, res)) {
    const uuid = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    const cookieObj = {
      userId: uuid,
      username: undefined,
      token: undefined,
    }

    const options = req && res ? { req, res } : {}
    setCookie('account', cookieObj, {
      path: '/',
      expires: expiresAt,
      ...options,
    })

    return uuid
  }
}

export const getLocalId = () => {
  const cookie = accountCookie()
  if (cookie) {
    const parsed = JSON.parse(cookie as string)
    if (parsed && !parsed.token)
      // Return the existing account cookie
      return parsed.userId
  } else {
    // Create a new account cookie and return
    return createLocalId()
  }
}
