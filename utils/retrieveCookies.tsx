import { getCookies } from 'cookies-next'
import { NextApiRequest, NextApiResponse } from 'next'

export default function retrieveCookies(
  req?: NextApiRequest,
  res?: NextApiResponse
): GranblueCookie | undefined {
  const cookies = getCookies({ req, res })
  const {
    account: accountData,
    user: userData,
    NEXT_LOCALE: localeData,
  } = cookies

  if ((!accountData || !userData) && localeData)
    return { account: undefined, user: undefined, locale: localeData }

  if (accountData && userData) {
    const account = JSON.parse(decodeURIComponent(accountData)) ?? undefined
    const user = JSON.parse(decodeURIComponent(userData)) ?? undefined
    const locale = localeData as string

    return { account, user, locale }
  }
}
