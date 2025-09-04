import { Metadata } from 'next'

// Force dynamic rendering to avoid issues
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Page not found / granblue.team',
  description: 'The page you were looking for could not be found'
}

export default function NotFound() {
  return (
    <div className="error-container">
      <div className="error-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you&apos;re looking for doesn&apos;t exist.</p>
        <div className="error-actions">
          <a href="/new" className="button primary">
            Create a new party
          </a>
          <a href="/teams" className="button secondary">
            Browse teams
          </a>
        </div>
      </div>
    </div>
  )
}