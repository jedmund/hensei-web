import React, { useEffect } from 'react'
import Head from 'next/head'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import Party from '~components/Party'

import api from '~utils/api'
import fetchLatestVersion from '~utils/fetchLatestVersion'
import organizeRaids from '~utils/organizeRaids'
import setUserToken from '~utils/setUserToken'
import { appState } from '~utils/appState'
import { groupWeaponKeys } from '~utils/groupWeaponKeys'
import { printError } from '~utils/reportError'

import type { NextApiRequest, NextApiResponse } from 'next'
import type { GroupedWeaponKeys } from '~utils/groupWeaponKeys'

interface Props {
  jobs: Job[]
  jobSkills: JobSkill[]
  raids: Raid[]
  sortedRaids: Raid[][]
  weaponKeys: GroupedWeaponKeys
  version: AppUpdate
}

const NewRoute: React.FC<Props> = (props: Props) => {
  // Import translations
  const { t } = useTranslation('common')

  function callback(path: string) {
    // This is scuffed, how do we do this natively?
    window.history.replaceState(null, `Grid Tool`, `${path}`)
  }

  useEffect(() => {
    persistStaticData()
  }, [persistStaticData])

  function persistStaticData() {
    appState.raids = props.raids
    appState.jobs = props.jobs
    appState.jobSkills = props.jobSkills
    appState.weaponKeys = props.weaponKeys
    appState.version = props.version
  }

  return (
    <React.Fragment>
      <Head>
        {/* HTML */}
        <title>{t('page.titles.new')}</title>
        <meta name="description" content={t('page.descriptions.new')} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

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
      <Party new={true} raids={props.sortedRaids} pushHistory={callback} />
    </React.Fragment>
  )
}

export const getServerSidePaths = async () => {
  return {
    paths: [
      // Object variant:
      { params: { party: 'string' } },
    ],
    fallback: true,
  }
}

// prettier-ignore
export const getServerSideProps = async ({ req, res, locale, query }: { req: NextApiRequest, res: NextApiResponse, locale: string, query: { [index: string]: string } }) => {
  // Set headers for server-side requests
  setUserToken(req, res)

  try {
    // Fetch latest version
    const version = await fetchLatestVersion()

    // Fetch and organize raids
    let { raids, sortedRaids } = await api.endpoints.raids
      .getAll()
      .then((response) => organizeRaids(response.data))

    let jobs = await api.endpoints.jobs.getAll().then((response) => {
      return response.data
    })

    let jobSkills = await api.allJobSkills().then((response) => response.data)

    let weaponKeys = await api.endpoints.weapon_keys
      .getAll()
      .then((response) => groupWeaponKeys(response.data))

    return {
      props: {
        jobs: jobs,
        jobSkills: jobSkills,
        raids: raids,
        sortedRaids: sortedRaids,
        weaponKeys: weaponKeys,
        version: version,
        ...(await serverSideTranslations(locale, ['common', 'roadmap'])),
        // Will be passed to the page component as props
      },
    }
  } catch (error) {
    printError(error, 'axios')
  }
}

export default NewRoute
