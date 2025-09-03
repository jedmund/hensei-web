import createMiddleware from 'next-intl/middleware'
import {locales, defaultLocale, type Locale} from './i18n.config'
import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'

const intl = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // Show locale in URL when not default
})

const PROTECTED_PATHS = ['/saved', '/profile'] as const
const MIXED_AUTH_PATHS = ['/api/parties', '/p/'] as const

export default function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl
  
  // Skip intl middleware for API routes
  if (!pathname.startsWith('/api/')) {
    // Run next-intl for non-API routes (handles locale detection, redirects, etc.)
    const intlResponse = intl(request)
    if (intlResponse) return intlResponse
  }
  const seg = pathname.split('/')[1]
  const pathWithoutLocale = locales.includes(seg as Locale)
    ? pathname.slice(seg.length + 1) || '/'
    : pathname

  const isProtectedPath = PROTECTED_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/')
  )
  const isMixedAuthPath = MIXED_AUTH_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p)
  )

  const needsAuth =
    isProtectedPath || (isMixedAuthPath && ['POST', 'PUT', 'DELETE'].includes(request.method))

  if (!needsAuth) return NextResponse.next()

  const accountCookie = request.cookies.get('account')
  if (!accountCookie?.value) {
    if (pathWithoutLocale.startsWith('/api/')) {
      return NextResponse.json({error: 'Authentication required'}, {status: 401})
    }
    // Preserve locale in redirect
    const url = request.nextUrl.clone()
    url.pathname = '/teams'
    return NextResponse.redirect(url)
  }

  try {
    const account = JSON.parse(accountCookie.value)
    if (!account.token) {
      if (pathWithoutLocale.startsWith('/api/')) {
        return NextResponse.json({error: 'Authentication required'}, {status: 401})
      }
      const url = request.nextUrl.clone()
      url.pathname = '/teams'
      return NextResponse.redirect(url)
    }
  } catch {
    if (pathWithoutLocale.startsWith('/api/')) {
      return NextResponse.json({error: 'Authentication required'}, {status: 401})
    }
    const url = request.nextUrl.clone()
    url.pathname = '/teams'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
}