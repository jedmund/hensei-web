import { setCookie } from 'cookies-next'
import { NextRouter } from 'next/router'

export default function changeLanguage(
  router: NextRouter,
  newLanguage: string
) {
  if (newLanguage !== router.locale) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    setCookie('NEXT_LOCALE', newLanguage, { path: '/', expires: expiresAt })
    router.push(router.asPath, undefined, { locale: newLanguage })
  }
}
