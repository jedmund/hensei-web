import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import Party from '~components/party/Party'
import ErrorSection from '~components/ErrorSection'
import PartyHead from '~components/party/PartyHead'

import api from '~utils/api'
import elementEmoji from '~utils/elementEmoji'
import fetchLatestVersion from '~utils/fetchLatestVersion'
import { setHeaders } from '~utils/userToken'
import { appState } from '~utils/appState'
import { GroupedWeaponKeys, groupWeaponKeys } from '~utils/groupWeaponKeys'

import * as JobTransformer from '~transformers/JobTransformer'
import * as JobSkillTransformer from '~transformers/JobTransformer'
import * as PartyTransformer from '~transformers/PartyTransformer'
import * as RaidGroupTransformer from '~transformers/RaidGroupTransformer'
import * as WeaponKeyTransformer from '~transformers/WeaponKeyTransformer'

import { GridType } from '~utils/enums'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { PageContextObj, ResponseStatus } from '~types'
import type { AxiosError } from 'axios'

interface Props {
  context?: PageContextObj
  version: AppUpdate
  error: boolean
  status?: ResponseStatus
}

const PartyRoute: React.FC<Props> = ({
  context,
  version,
  error,
  status,
}: Props) => {
  // Set up state to save selected tab and
  // update when router changes
  const router = useRouter()

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
  }, [])

  const getCurrentTab = () => {
    const parts = router.asPath.split('/')
    const tab = parts[parts.length - 1]

    switch (tab) {
      case 'characters':
        return GridType.Character
      case 'weapons':
        return GridType.Weapon
      case 'summons':
        return GridType.Summon
      default:
        return GridType.Weapon
    }
  }

  const [selectedTab, setSelectedTab] = useState<GridType>(getCurrentTab())

  const handleTabChange = (value: string) => {
    const path = [
      // Enable when using Next.js Router
      // 'p',
      router.asPath.split('/').filter((el) => el != '')[1],
      value,
    ].join('/')

    switch (value) {
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

    // if (router.asPath !== '/new' && router.asPath !== '/')
    //   router.replace(path, undefined, { shallow: true })
  }

  // Set the initial data from props
  useEffect(() => {
    if (context && !error) {
      appState.raidGroups = context.raidGroups
      appState.jobs = context.jobs ? context.jobs : []
      appState.jobSkills = context.jobSkills ? context.jobSkills : []
      appState.weaponKeys = context.weaponKeys
    }

    if (status && error) {
      appState.status = status
    }

    appState.version = version
  }, [])

  // Methods: Page component rendering
  function pageHead() {
    if (context && context.party && context.meta)
      return <PartyHead party={context.party} meta={context.meta} />
  }

  function pageError() {
    if (status) return <ErrorSection status={status} />
    else return <div />
  }

  if (context) {
    return (
      <React.Fragment key={router.asPath}>
        {pageHead()}
        <Party
          party={context.party}
          selectedTab={selectedTab}
          raidGroups={context.raidGroups}
          handleTabChanged={handleTabChange}
        />
      </React.Fragment>
    )
  } else return pageError()
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
  setHeaders(req, res)

  // Fetch latest version
  const version = await fetchLatestVersion()

  try {
    // Fetch and organize raids
    const raidGroups: RaidGroup[] = await api
      .raidGroups()
      .then((response) => response.data.map((group: any) => RaidGroupTransformer.toObject(group)))

    // Fetch jobs and job skills
    const jobs: Job[] = await api.endpoints.jobs
      .getAll()
      .then((response) =>
        response.data.map((job: any) => JobTransformer.toObject(job))
      )

    const jobSkills: JobSkill[] = await api
      .allJobSkills()
      .then((response) =>
        response.data.map((skill: any) => JobSkillTransformer.toObject(skill))
      )

    // Fetch and organize weapon keys
    const weaponKeys: GroupedWeaponKeys = await api.endpoints.weapon_keys
      .getAll()
      .then((response) =>
        response.data.map((key: any) => WeaponKeyTransformer.toObject(key))
      )
      .then((keys) => groupWeaponKeys(keys))
      

    // Fetch the party
    if (!query.party) throw new Error('No party code')
    
    const party: Party | undefined = await api.endpoints.parties.getOne({
      id: query.party,
    }).then((response) => PartyTransformer.toObject(response.data.party))

    // Consolidate data into context object
    const context: PageContextObj = {
      party: party,
      jobs: jobs,
      jobSkills: jobSkills,
      raidGroups: raidGroups,
      weaponKeys: weaponKeys,
      meta: {
        element: elementEmoji(party),
      },
    }

    // Pass to the page component as props
    return {
      props: {
        context: context,
        version: version,
        error: false,
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  } catch (error) {
    console.error(error)

    // Extract the underlying Axios error
    const axiosError = error as AxiosError
    const response = axiosError.response

    // Pass to the page component as props
    return {
      props: {
        context: null,
        error: true,
        version: version,
        status: {
          code: response?.status,
          text: response?.statusText,
        },
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  }
}

export default PartyRoute
