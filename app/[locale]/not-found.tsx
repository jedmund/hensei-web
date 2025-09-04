import { Metadata } from 'next'
import { Link } from '~/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Page not found / granblue.team',
  description: 'The page you were looking for could not be found'
}

export default async function NotFound() {
  const t = await getTranslations('common')
  
  return (
    <div className="error-container">
      <div className="error-content">
        <h1>Not Found</h1>
        <p>The page you&apos;re looking for couldn&apos;t be found</p>
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
