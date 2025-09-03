import React from 'react'
import Head from 'next/head'
import { useTranslations } from 'next-intl'

const NewHead = () => {
  // Import translations
  const t = useTranslations('common')

  return (
    <Head>
      {/* HTML */}
      <title>{t('page.titles.new')}</title>
      <meta name="description" content={t('page.descriptions.new')} />

      <link rel="icon" type="image/x-icon" href="/images/favicon.png" />

      {/* OpenGraph */}
      <meta property="og:title" content={t('page.titles.new')} />
      <meta property="og:description" content={t('page.descriptions.new')} />
      <meta property="og:url" content={`https://app.granblue.team/`} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="app.granblue.team" />
      <meta name="twitter:title" content={t('page.titles.new')} />
      <meta name="twitter:description" content={t('page.descriptions.new')} />
    </Head>
  )
}

export default NewHead
