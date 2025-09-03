'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import '../styles/globals.scss'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="error-container">
          <div className="error-content">
            <h1>Something went wrong</h1>
            <p>The application has encountered a critical error and cannot continue.</p>
            <div className="error-message">
              <p>{error.message || 'An unexpected error occurred'}</p>
              {error.digest && <p className="error-digest">Error ID: {error.digest}</p>}
            </div>
            <div className="error-actions">
              <button onClick={reset} className="button primary">
                Try again
              </button>
              <a
                href="https://discord.gg/qyZ5hGdPC8"
                target="_blank"
                rel="noreferrer noopener"
                className="button secondary"
              >
                Report on Discord
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}