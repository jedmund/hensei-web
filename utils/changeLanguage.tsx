import { setCookie } from 'cookies-next'
import { useRouter } from 'next/router'

export default function changeLanguage(newLanguage: string) {
  const router = useRouter()

  if (newLanguage !== router.locale) {
    setCookie('NEXT_LOCALE', newLanguage, { path: '/' })
    router.push(router.asPath, undefined, { locale: newLanguage })
  }
}
