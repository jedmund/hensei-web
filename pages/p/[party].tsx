import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import Party from '~components/Party'

import api from '~utils/api'
import generateTitle from '~utils/generateTitle'
import organizeRaids from '~utils/organizeRaids'
import setUserToken from '~utils/setUserToken'
import { appState } from '~utils/appState'
import { groupWeaponKeys } from '~utils/groupWeaponKeys'
import { GridType } from '~utils/enums'
import { printError } from '~utils/reportError'

import type { NextApiRequest, NextApiResponse } from 'next'
import type { GroupedWeaponKeys } from '~utils/groupWeaponKeys'

interface Props {
  party: Party
  jobs: Job[]
  jobSkills: JobSkill[]
  raids: Raid[]
  sortedRaids: Raid[][]
  weaponKeys: GroupedWeaponKeys
  meta: { [key: string]: string }
}

const PartyRoute: React.FC<Props> = (props: Props) => {
  // Import translations
  const { t } = useTranslation('common')

  // Set up router
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  // URL state
  const [selectedTab, setSelectedTab] = useState<GridType>(GridType.Weapon)

  useEffect(() => {
    const parts = router.asPath.split('/')
    const tab = parts[parts.length - 1]

    switch (tab) {
      case 'characters':
        setSelectedTab(GridType.Character)
        break
      case 'weapons':
        setSelectedTab(GridType.Weapon)
        break
      case 'summons':
        setSelectedTab(GridType.Summon)
        break
    }
  }, [router.asPath])

  // Static data
  useEffect(() => {
    persistStaticData()
  }, [persistStaticData])

  function persistStaticData() {
    appState.raids = props.raids
    appState.jobs = props.jobs
    appState.jobSkills = props.jobSkills
    appState.weaponKeys = props.weaponKeys
  }

  return (
    <React.Fragment key={router.asPath}>
      <Party
        team={props.party}
        raids={props.sortedRaids}
        selectedTab={selectedTab}
      />
      <Head>
        {/* HTML */}
        <title>
          {generateTitle(
            props.meta.element,
            props.party.user?.username,
            props.party.name
          )}
        </title>
        <meta
          name="description"
          content={t('page.descriptions.team', {
            username: props.party.user?.username,
            raidName: props.party.raid ? props.party.raid.name[locale] : '',
          })}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* OpenGraph */}
        <meta
          property="og:title"
          content={generateTitle(
            props.meta.element,
            props.party.user?.username,
            props.party.name
          )}
        />
        <meta
          property="og:description"
          content={t('page.descriptions.team', {
            username: props.party.user?.username,
            raidName: props.party.raid ? props.party.raid.name[locale] : '',
          })}
        />
        <meta
          property="og:url"
          content={`https://app.granblue.team/p/${props.party.shortcode}`}
        />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="app.granblue.team" />
        <meta
          name="twitter:title"
          content={generateTitle(
            props.meta.element,
            props.party.user?.username,
            props.party.name
          )}
        />
        <meta
          name="twitter:description"
          content={t('page.descriptions.team', {
            username: props.party.user?.username,
            raidName: props.party.raid ? props.party.raid.name[locale] : '',
          })}
        />
      </Head>
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

  function getElement(party?: Party) {
    if (party) {
      const mainhand = party.weapons.find((weapon) => weapon.mainhand)
      if (mainhand && mainhand.object.element === 0) {
        return mainhand.element
      } else {
        return mainhand?.object.element
      }
    } else {
      return 0
    }
  }

  function elementEmoji(party?: Party) {
    const element = getElement(party)

    if (element === 0) return '⚪'
    else if (element === 1) return '🟢'
    else if (element === 2) return '🔴'
    else if (element === 3) return '🔵'
    else if (element === 4) return '🟤'
    else if (element === 5) return '🟣'
    else if (element === 6) return '🟡'
    else return '⚪'
  }

  try {
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

    let party: Party | undefined = undefined
    if (query.party) {
      let response = await api.endpoints.parties.getOne({
        id: query.party,
      })
      party = response.data.party
    } else {
      console.log('No party code')
    }

    return {
      props: {
        party: party,
        jobs: jobs,
        jobSkills: jobSkills,
        raids: raids,
        sortedRaids: sortedRaids,
        weaponKeys: weaponKeys,
        meta: {
          element: elementEmoji(party),
        },
        ...(await serverSideTranslations(locale, ['common', 'roadmap'])),
        // Will be passed to the page component as props
      },
    }
  } catch (error) {
    printError(error, 'axios')
  }
}

export default PartyRoute
