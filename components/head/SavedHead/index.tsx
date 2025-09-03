import React from 'react'
import Head from 'next/head'
import { useTranslations } from 'next-intl'

const SavedHead = () => {
  // Import translations
  const t = useTranslations('common')

  return (
    <Head>
      <title>{t('page.titles.saved')}</title>

      <link rel="icon" type="image/x-icon" href="/images/favicon.png" />

      <meta property="og:title" content={t('page.titles.saved')} />
      <meta property="og:url" content="https://app.granblue.team/saved" />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="app.granblue.team" />
      <meta name="twitter:title" content={t('page.titles.saved')} />
    </Head>
  )
}

export default SavedHead
