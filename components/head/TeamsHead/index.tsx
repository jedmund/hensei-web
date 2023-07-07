import React from 'react'
import Head from 'next/head'
import { useTranslation } from 'next-i18next'

const TeamsHead = () => {
  // Import translations
  const { t } = useTranslation('common')

  return (
    <Head>
      {/* HTML */}
      <title>{t('page.titles.discover')}</title>
      <meta name="description" content={t('page.descriptions.discover')} />
      <link rel="icon" type="image/x-icon" href="/images/favicon.png" />

      {/* OpenGraph */}
      <meta property="og:title" content={t('page.titles.discover')} />
      <meta
        property="og:description"
        content={t('page.descriptions.discover')}
      />
      <meta property="og:url" content="https://app.granblue.team/teams" />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="app.granblue.team" />
      <meta name="twitter:title" content={t('page.titles.discover')} />
      <meta
        name="twitter:description"
        content={t('page.descriptions.discover')}
      />
    </Head>
  )
}

export default TeamsHead
