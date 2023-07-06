import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function useLocale() {
  const router = useRouter()

  const [locale, setLocale] = useState(router.locale || 'en')

  useEffect(() => {
    setLocale(router.locale || 'en')
  }, [router])

  return locale
}
