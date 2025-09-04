import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

// Force dynamic rendering to avoid useContext issues during static generation
export const dynamic = 'force-dynamic'
import AboutPageClient from './AboutPageClient'

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'common' })
  
  return {
    title: t('page.titles.about'),
    description: t('page.descriptions.about')
  }
}

export default async function AboutPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  return (
    <div id="About">
      <AboutPageClient />
    </div>
  )
}