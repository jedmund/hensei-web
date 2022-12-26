import { setCookie } from 'cookies-next'
import { NextRouter } from 'next/router'

export default function changeLanguage(
  router: NextRouter,
  newLanguage: string
) {
  if (newLanguage !== router.locale) {
    setCookie('NEXT_LOCALE', newLanguage, { path: '/' })
    router.push(router.asPath, undefined, { locale: newLanguage })
  }
}
