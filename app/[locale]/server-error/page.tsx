import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Server Error / granblue.team',
  description: 'The server encountered an internal error and was unable to complete your request'
}

export default function ServerErrorPage() {
  return (
    <div className="error-container">
      <div className="error-content">
        <h1>Internal Server Error</h1>
        <p>The server encountered an internal error and was unable to complete your request.</p>
        <p>Our team has been notified and is working to fix the issue.</p>
        <div className="error-actions">
          <Link href="/teams" className="button primary">
            Browse teams
          </Link>
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
  )
}