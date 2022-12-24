import React, { useEffect } from 'react'
import { getCookie } from 'cookies-next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import Party from '~components/Party'

import { appState } from '~utils/appState'
import { groupWeaponKeys } from '~utils/groupWeaponKeys'
import organizeRaids from '~utils/organizeRaids'
import api from '~utils/api'

import type { NextApiRequest, NextApiResponse } from 'next'
import type { GroupedWeaponKeys } from '~utils/groupWeaponKeys'

interface Props {
  party: Party
  jobs: Job[]
  jobSkills: JobSkill[]
  raids: Raid[]
  sortedRaids: Raid[][]
  weaponKeys: GroupedWeaponKeys
}

const PartyRoute: React.FC<Props> = (props: Props) => {
  useEffect(() => {
    persistStaticData()
  }, [persistStaticData])

  function persistStaticData() {
    appState.raids = props.raids
    appState.jobs = props.jobs
    appState.jobSkills = props.jobSkills
    appState.weaponKeys = props.weaponKeys
  }

  return <Party team={props.party} raids={props.sortedRaids} />
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
  // Cookies
  const cookie = getCookie("account", { req, res })
  const accountData: AccountCookie = cookie
    ? JSON.parse(cookie as string)
    : null

  const headers = accountData
    ? { headers: { Authorization: `Bearer ${accountData.token}` } }
    : {}

  let { raids, sortedRaids } = await api.endpoints.raids
    .getAll()
    .then((response) => organizeRaids(response.data))

  let jobs = await api.endpoints.jobs
    .getAll({ params: headers })
    .then((response) => {
      return response.data
    })

  let jobSkills = await api.allJobSkills(headers).then((response) => response.data)

  let weaponKeys = await api.endpoints.weapon_keys
    .getAll()
    .then((response) => groupWeaponKeys(response.data))
  
  let party: Party | null = null
  if (query.party) {
    let response = await api.endpoints.parties.getOne({ id: query.party, params: headers })
    party = response.data.party
  } else {
    console.log("No party code")
  }

  return {
    props: {
      party: party,
      jobs: jobs,
      jobSkills: jobSkills,
      raids: raids,
      sortedRaids: sortedRaids,
      weaponKeys: weaponKeys,
      ...(await serverSideTranslations(locale, ["common"])),
      // Will be passed to the page component as props
    },
  }
}

export default PartyRoute
