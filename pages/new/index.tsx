import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { v4 as uuidv4 } from 'uuid'
import clonedeep from 'lodash.clonedeep'

import ErrorSection from '~components/ErrorSection'
import Party from '~components/Party'
import NewHead from '~components/NewHead'

import api from '~utils/api'
import fetchLatestVersion from '~utils/fetchLatestVersion'
import organizeRaids from '~utils/organizeRaids'
import { accountCookie, setHeaders } from '~utils/userToken'
import { appState, initialAppState } from '~utils/appState'
import { groupWeaponKeys } from '~utils/groupWeaponKeys'

import type { AxiosError } from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { PageContextObj, ResponseStatus } from '~types'
import { GridType } from '~utils/enums'
import { setCookie } from 'cookies-next'

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
  const [selectedTab, setSelectedTab] = useState<GridType>(GridType.Weapon)

  function callback(path: string) {
    router.push(path, undefined, { shallow: true })
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

  useEffect(() => {
    if (context && context.jobs && context.jobSkills) {
      appState.raids = context.raids
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
    if (context && context.user) return <NewHead />
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
          raids={context.sortedRaids}
          pushHistory={callback}
          selectedTab={selectedTab}
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
  if (!accountCookie(req, res)) {
    const uuid = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    const cookieObj = {
      userId: uuid,
      username: undefined,
      token: undefined,
    }

    const options = req && res ? { req, res } : {}
    setCookie('account', cookieObj, { path: '/', expires: expiresAt, ...options })
  }

  // Fetch latest version
  const version = await fetchLatestVersion()

  try {
    // Fetch and organize raids
    let { raids, sortedRaids } = await api.endpoints.raids
      .getAll()
      .then((response) => organizeRaids(response.data))

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
      raids: raids,
      sortedRaids: sortedRaids,
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
