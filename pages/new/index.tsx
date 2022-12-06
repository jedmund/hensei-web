import React, { useEffect } from 'react'
import { getCookie } from 'cookies-next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import Party from '~components/Party'

import { appState } from '~utils/appState'
import api from '~utils/api'

import type { NextApiRequest, NextApiResponse } from 'next'

interface Props {
  jobs: Job[]
  jobSkills: JobSkill[]
  raids: Raid[]
  sortedRaids: Raid[][]
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
  // Cookies
  const cookie = getCookie("account", { req, res })
  const accountData: AccountCookie = cookie
    ? JSON.parse(cookie as string)
    : null

  const headers = accountData
    ? { headers: { Authorization: `Bearer ${accountData.token}` } }
    : {}

  let { raids, sortedRaids } = await api.endpoints.raids
    .getAll({ params: headers })
    .then((response) => organizeRaids(response.data.map((r: any) => r.raid)))
  
  let jobs = await api.endpoints.jobs
    .getAll({ params: headers })
    .then((response) => { return response.data })
  
  let jobSkills = await api.allSkills(headers)
    .then((response) => { return response.data })
  
  return {
    props: {
      jobs: jobs,
      jobSkills: jobSkills,
      raids: raids,
      sortedRaids: sortedRaids,
      ...(await serverSideTranslations(locale, ["common"])),
      // Will be passed to the page component as props
    },
  }
}

const organizeRaids = (raids: Raid[]) => {
  // Set up empty raid for "All raids"
  const all = {
    id: '0',
    name: {
      en: 'All raids',
      ja: '全て',
    },
    slug: 'all',
    level: 0,
    group: 0,
    element: 0,
  }

  const numGroups = Math.max.apply(
    Math,
    raids.map((raid) => raid.group)
  )
  let groupedRaids = []

  for (let i = 0; i <= numGroups; i++) {
    groupedRaids[i] = raids.filter((raid) => raid.group == i)
  }

  return {
    raids: raids,
    sortedRaids: groupedRaids,
  }
}

export default NewRoute
