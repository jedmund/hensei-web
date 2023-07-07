import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useTranslation } from 'next-i18next'

interface Props {
  page: string
}

const AboutHead = ({ page }: Props) => {
  // Import translations
  const { t } = useTranslation('common')

  // State
  const [currentPage, setCurrentPage] = useState('about')

  // Hooks
  useEffect(() => {
    setCurrentPage(page)
  }, [page])

  return (
    <Head>
      {/* HTML */}
      <title>{t(`page.titles.${currentPage}`)}</title>
      <meta
        name="description"
        content={t(`page.descriptions.${currentPage}`)}
      />

      <link rel="icon" type="image/x-icon" href="/images/favicon.png" />

      {/* OpenGraph */}
      <meta property="og:title" content={t(`page.titles.${currentPage}`)} />
      <meta property="og:description" content={t('page.descriptions.about')} />
      <meta
        property="og:url"
        content={`https://app.granblue.team/${currentPage}`}
      />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="app.granblue.team" />
      <meta name="twitter:title" content={t(`page.titles.${currentPage}`)} />
      <meta
        name="twitter:description"
        content={t(`page.descriptions.${currentPage}`)}
      />
    </Head>
  )
}

export default AboutHead
