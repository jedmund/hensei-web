import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
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