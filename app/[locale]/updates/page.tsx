import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import UpdatesPageClient from './UpdatesPageClient'

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'common' })
  
  return {
    title: t('page.titles.updates'),
    description: t('page.descriptions.updates')
  }
}

export default async function UpdatesPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  return (
    <div id="About">
      <UpdatesPageClient />
    </div>
  )
}