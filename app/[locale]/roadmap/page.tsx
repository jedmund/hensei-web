import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import RoadmapPageClient from './RoadmapPageClient'

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'common' })
  
  return {
    title: t('page.titles.roadmap'),
    description: t('page.descriptions.roadmap')
  }
}

export default async function RoadmapPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  return (
    <div id="About">
      <RoadmapPageClient />
    </div>
  )
}