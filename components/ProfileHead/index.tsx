import React from 'react'
import Head from 'next/head'
import { useTranslation } from 'next-i18next'

interface Props {
  user: User
}

const ProfileHead = ({ user }: Props) => {
  // Import translations
  const { t } = useTranslation('common')

  return (
    <Head>
      {/* HTML */}
      <title>{t('page.titles.profile', { username: user.username })}</title>
      <meta
        name="description"
        content={t('page.descriptions.profile', {
          username: user.username,
        })}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* OpenGraph */}
      <meta
        property="og:title"
        content={t('page.titles.profile', { username: user.username })}
      />
      <meta
        property="og:description"
        content={t('page.descriptions.profile', {
          username: user.username,
        })}
      />
      <meta
        property="og:url"
        content={`https://app.granblue.team/${user.username}`}
      />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="app.granblue.team" />
      <meta
        name="twitter:title"
        content={t('page.titles.profile', { username: user.username })}
      />
      <meta
        name="twitter:description"
        content={t('page.descriptions.profile', {
          username: user.username,
        })}
      />
    </Head>
  )
}

export default ProfileHead
