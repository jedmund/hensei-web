import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import api from '~utils/api'

import generateTitle from '~utils/generateTitle'

interface Props {
  party: Party
  meta: { [key: string]: string }
}

const PartyHead = ({ party, meta }: Props) => {
  // Import translations
  const { t } = useTranslation('common')

  // Set up router
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const previewUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL || 'https://granblue.team'
  }/p/${party.shortcode}/preview`

  return (
    <Head>
      {/* HTML */}
      <title>
        {generateTitle(meta.element, party.user?.username, party.name)}
      </title>
      <meta
        name="description"
        content={t('page.descriptions.team', {
          username: party.user?.username,
          raidName: party.raid ? party.raid.name[locale] : '',
        })}
      />

      <link rel="icon" type="image/x-icon" href="/images/favicon.png" />

      {/* OpenGraph */}
      <meta
        property="og:title"
        content={generateTitle(meta.element, party.user?.username, party.name)}
      />
      <meta
        property="og:description"
        content={t('page.descriptions.team', {
          username: party.user?.username,
          raidName: party.raid ? party.raid.name[locale] : '',
        })}
      />
      <meta
        property="og:url"
        content={`https://app.granblue.team/p/${party.shortcode}`}
      />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={previewUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="app.granblue.team" />
      <meta
        name="twitter:title"
        content={generateTitle(meta.element, party.user?.username, party.name)}
      />
      <meta
        name="twitter:description"
        content={t('page.descriptions.team', {
          username: party.user?.username,
          raidName: party.raid ? party.raid.name[locale] : '',
        })}
      />
      <meta name="twitter:image" content={previewUrl} />
    </Head>
  )
}

export default PartyHead
