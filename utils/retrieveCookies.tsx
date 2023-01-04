import { getCookies } from 'cookies-next'
import { NextApiRequest, NextApiResponse } from 'next'

export function retrieveCookies(
  req?: NextApiRequest,
  res?: NextApiResponse
): GranblueCookie | undefined {
  const cookies = getCookies({ req, res })
  if (!cookies) return undefined

  const {
    account: accountData,
    user: userData,
    NEXT_LOCALE: localeData,
  } = cookies
  if (!accountData || !userData) return undefined

  const account = JSON.parse(decodeURIComponent(accountData)) ?? undefined
  const user = JSON.parse(decodeURIComponent(userData)) ?? undefined
  const locale = localeData as string

  return { account, user, locale }
}

export function retrieveLocaleCookies(
  req?: NextApiRequest,
  res?: NextApiResponse
) {
  const cookies = getCookies({ req, res })
  const { NEXT_LOCALE: localeData } = cookies
  return localeData as string
}
