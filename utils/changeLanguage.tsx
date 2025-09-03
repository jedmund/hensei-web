'use client'

import { setCookie } from 'cookies-next'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export default function changeLanguage(
  router: AppRouterInstance,
  newLanguage: string
) {
  // In App Router, locale handling is different
  // We set the cookie and refresh the page to apply the new locale
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 60)

  setCookie('NEXT_LOCALE', newLanguage, { path: '/', expires: expiresAt })
  
  // App Router doesn't have router.locale or locale option in push
  // The locale is handled via the cookie and middleware
  router.refresh()
}
