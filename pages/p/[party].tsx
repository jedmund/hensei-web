import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import Party from '~components/Party'
import ErrorSection from '~components/ErrorSection'
import PartyHead from '~components/PartyHead'

import api from '~utils/api'
import elementEmoji from '~utils/elementEmoji'
import fetchLatestVersion from '~utils/fetchLatestVersion'
import organizeRaids from '~utils/organizeRaids'
import setUserToken from '~utils/setUserToken'
import { appState } from '~utils/appState'
import { groupWeaponKeys } from '~utils/groupWeaponKeys'

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

  // Set the initial data from props
  useEffect(() => {
    if (context && !error) {
      appState.raids = context.raids
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
          team={context.party}
          raids={context.sortedRaids}
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
  // Set headers for server-side requests
  setUserToken(req, res)

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

    let jobSkills = await api.allJobSkills().then((response) => response.data)

    // Fetch and organize weapon keys
    let weaponKeys = await api.endpoints.weapon_keys
      .getAll()
      .then((response) => groupWeaponKeys(response.data))

    // Fetch the party
    let party: Party | undefined = undefined
    if (query.party) {
      let response = await api.endpoints.parties.getOne({
        id: query.party,
      })
      party = response.data.party
    } else {
      console.error('No party code')
    }

    // Consolidate data into context object
    const context: PageContextObj = {
      party: party,
      jobs: jobs,
      jobSkills: jobSkills,
      raids: raids,
      sortedRaids: sortedRaids,
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
        ...(await serverSideTranslations(locale, ['common', 'roadmap'])),
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
        version: version,
        status: {
          code: response?.status,
          text: response?.statusText,
        },
        ...(await serverSideTranslations(locale, ['common', 'roadmap'])),
      },
    }
  }
}

export default PartyRoute
