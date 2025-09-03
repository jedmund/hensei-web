'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="error-container">
      <div className="error-content">
        <h1>Internal Server Error</h1>
        <p>The server reported a problem that we couldn't automatically recover from.</p>
        <div className="error-message">
          <p>{error.message || 'An unexpected error occurred'}</p>
          {error.digest && <p className="error-digest">Error ID: {error.digest}</p>}
        </div>
        <div className="error-actions">
          <button onClick={reset} className="button primary">
            Try again
          </button>
          <Link href="/teams" className="button secondary">
            Browse teams
          </Link>
        </div>
      </div>
    </div>
  )
}