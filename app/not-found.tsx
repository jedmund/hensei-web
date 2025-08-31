import { Metadata } from 'next'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'

export const metadata: Metadata = {
  title: 'Page not found / granblue.team',
  description: 'The page you were looking for could not be found'
}

export default function NotFound() {
  return (
    <div className="error-container">
      <div className="error-content">
        <h1>Not Found</h1>
        <p>The page you're looking for couldn't be found</p>
        <div className="error-actions">
          <Link href="/new" className="button primary">
            Create a new party
          </Link>
          <Link href="/teams" className="button secondary">
            Browse teams
          </Link>
        </div>
      </div>
    </div>
  )
}