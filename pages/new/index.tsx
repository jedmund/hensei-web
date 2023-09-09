import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { get, set } from 'local-storage'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import clonedeep from 'lodash.clonedeep'

import ErrorSection from '~components/ErrorSection'
import Party from '~components/party/Party'
import NewHead from '~components/head/NewHead'

import api from '~utils/api'
import fetchLatestVersion from '~utils/fetchLatestVersion'
import { setHeaders } from '~utils/userToken'
import { appState, initialAppState } from '~utils/appState'
import { createLocalId } from '~utils/localId'
import { groupWeaponKeys } from '~utils/groupWeaponKeys'

import type { AxiosError } from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { PageContextObj, ResponseStatus } from '~types'
import { GridType } from '~utils/enums'

interface Props {
  context?: PageContextObj
  version: AppUpdate
  error: boolean
  status?: ResponseStatus
}

const NewRoute: React.FC<Props> = ({
  context,
  version,
  error,
  status,
}: Props) => {
  // Set up router
  const router = useRouter()

  function callback(path: string) {
    router.push(path, undefined, { shallow: true })
  }

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

    if (router.asPath !== '/new' && router.asPath !== '/')
      router.replace(path, undefined, { shallow: true })
  }

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

  // Persist generated userId in storage
  useEffect(() => {
    const cookie = getCookie('account')
    const data: AccountCookie = JSON.parse(cookie as string)
    if (!get('userId') && data && !data.token) set('userId', data.userId)
  }, [])

  useEffect(() => {
    if (context && context.jobs && context.jobSkills) {
      appState.raidGroups = context.raidGroups
      appState.jobs = context.jobs
      appState.jobSkills = context.jobSkills
      appState.weaponKeys = context.weaponKeys
    }
    appState.version = version
  }, [context, version])

  useEffect(() => {
    // Clean state
    const resetState = clonedeep(initialAppState)
    appState.party = resetState.party
    appState.grid = resetState.grid

    // Old method kept in case we need it later
    // Object.keys(resetState).forEach((key) => {
    //   appState[key] = resetState[key]
    // })

    // Set party to be editable
    appState.party.editable = true
  }, [])

  // Methods: Page component rendering
  function pageHead() {
    return <NewHead />
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
          new={true}
          pushHistory={callback}
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
  // Set headers for API calls
  setHeaders(req, res)

  // If there is no account entry in cookies, create a UUID and store it
  createLocalId(req, res)

  // Fetch latest version
  const version = await fetchLatestVersion()

  try {
    // Fetch and organize raids
    let raidGroups: RaidGroup[] = await api.raidGroups().then((response) => response.data)

    // Fetch jobs and job skills
    let jobs = await api.endpoints.jobs
      .getAll()
      .then((response) => response.data)

    let jobSkills = await api.allJobSkills()
      .then((response) => response.data)

    // Fetch and organize weapon keys
    let weaponKeys = await api.endpoints.weapon_keys
      .getAll()
      .then((response) => groupWeaponKeys(response.data))

    // Consolidate data into context object
    const context: PageContextObj = {
      jobs: jobs,
      jobSkills: jobSkills,
      raidGroups: raidGroups,
      weaponKeys: weaponKeys,
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
    // Extract the underlying Axios error
    const axiosError = error as AxiosError
    const response = axiosError.response

    // Pass to the page component as props
    return {
      props: {
        context: null,
        error: true,
        status: {
          code: response?.status,
          text: response?.statusText,
        },
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  }
}

export default NewRoute
