import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that require authentication
const PROTECTED_PATHS = [
  // API paths that require auth
  '/api/parties/create',
  '/api/parties/update',
  '/api/parties/delete',
  '/api/favorites',
  '/api/users/settings',
  
  // Page paths that require auth
  '/saved',
  '/profile',
]

// Paths that are public but have protected actions
const MIXED_AUTH_PATHS = [
  '/api/parties', // GET is public, POST requires auth
  '/p/', // Viewing is public, editing requires auth
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if path requires authentication
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
  
  // For mixed auth paths, check the request method
  const isMixedAuthPath = MIXED_AUTH_PATHS.some(path => 
    pathname === path || pathname.startsWith(path)
  )
  
  const needsAuth = isProtectedPath || 
    (isMixedAuthPath && ['POST', 'PUT', 'DELETE'].includes(request.method))
  
  if (needsAuth) {
    // Get the authentication cookie
    const accountCookie = request.cookies.get('account')
    
    // If no token or invalid format, redirect to login
    if (!accountCookie?.value) {
      // For API routes, return 401 Unauthorized
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      // For page routes, redirect to teams page
      return NextResponse.redirect(new URL('/teams', request.url))
    }
    
    try {
      // Parse the cookie to check for token
      const accountData = JSON.parse(accountCookie.value)
      
      if (!accountData.token) {
        // For API routes, return 401 Unauthorized
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }
        
        // For page routes, redirect to teams page
        return NextResponse.redirect(new URL('/teams', request.url))
      }
    } catch (e) {
      // For API routes, return 401 Unauthorized if cookie is invalid
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      // For page routes, redirect to teams page
      return NextResponse.redirect(new URL('/teams', request.url))
    }
  }
  
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match specific protected pages
    '/saved',
    '/profile',
    // Match party pages for mixed auth
    '/p/:path*',
  ],
}