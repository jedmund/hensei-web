import React, { useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import Party from '~components/Party'

import { appState } from '~utils/appState'
import { groupWeaponKeys } from '~utils/groupWeaponKeys'
import organizeRaids from '~utils/organizeRaids'
import setUserToken from '~utils/setUserToken'
import api from '~utils/api'

import type { NextApiRequest, NextApiResponse } from 'next'
import type { GroupedWeaponKeys } from '~utils/groupWeaponKeys'

interface Props {
  jobs: Job[]
  jobSkills: JobSkill[]
  raids: Raid[]
  sortedRaids: Raid[][]
  weaponKeys: GroupedWeaponKeys
}

const NewRoute: React.FC<Props> = (props: Props) => {
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
  }

  return <Party new={true} raids={props.sortedRaids} pushHistory={callback} />
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

  let { raids, sortedRaids } = await api.endpoints.raids
    .getAll()
    .then((response) => organizeRaids(response.data))

  let jobs = await api.endpoints.jobs
    .getAll()
    .then((response) => {
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
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

export default NewRoute
