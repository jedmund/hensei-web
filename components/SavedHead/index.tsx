import React from 'react'
import Head from 'next/head'
import { useTranslation } from 'next-i18next'

const SavedHead = () => {
  // Import translations
  const { t } = useTranslation('common')

  return (
    <Head>
      <title>{t('page.titles.saved')}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

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
