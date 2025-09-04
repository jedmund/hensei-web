import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Unauthorized / granblue.team',
  description: "You don't have permission to perform that action"
}

export default function UnauthorizedPage() {
  return (
    <div className="error-container">
      <div className="error-content">
        <h1>Unauthorized</h1>
        <p>You don&apos;t have permission to perform that action</p>
        <div className="error-actions">
          <Link href="/teams" className="button primary">
            Browse teams
          </Link>
        </div>
      </div>
    </div>
  )
}