import React, { useEffect } from "react"
import Head from "next/head"
import { getCookie } from "cookies-next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { useRouter } from "next/router"
import { useTranslation } from "next-i18next"

import Party from "~components/Party"

import { appState } from "~utils/appState"
import api from "~utils/api"

import type { NextApiRequest, NextApiResponse } from "next"

interface Props {
  party: Party
  jobs: Job[]
  jobSkills: JobSkill[]
  raids: Raid[]
  sortedRaids: Raid[][]
}

const PartyRoute: React.FC<Props> = (props: Props) => {
  const { t } = useTranslation("common")
  const router = useRouter()
  const locale = router.locale || "en"

  useEffect(() => {
    persistStaticData()
  }, [persistStaticData])

  function persistStaticData() {
    appState.raids = props.raids
    appState.jobs = props.jobs
    appState.jobSkills = props.jobSkills
  }

  const title = () => {
    let title = props.party.raid ? `[${props.party.raid?.name[locale]}] ` : ""

    const username =
      props.party.user != null
        ? `@${props.party.user?.username}`
        : t("header.anonymous")

    if (props.party.name != null)
      title += t("header.byline", {
        partyName: props.party.name,
        username: username,
      })
    else
      title += t("header.untitled_team", {
        username: username,
      })

    return title
  }

  return (
    <div>
      <Head>
        <title>{title()}</title>

        <meta property="og:title" content={title()} />
        <meta
          property="og:description"
          content={props.party.description ? props.party.description : ""}
        />
        <meta property="og:url" content="https://app.granblue.team" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="app.granblue.team" />
        <meta name="twitter:title" content={title()} />
        <meta
          name="twitter:description"
          content={props.party.description ? props.party.description : ""}
        />
      </Head>
      <div id="Content">
        <Party team={props.party} raids={props.sortedRaids} />
      </div>
    </div>
  )
}

export const getServerSidePaths = async () => {
  return {
    paths: [
      // Object variant:
      { params: { party: "string" } },
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
    .then((response) => organizeRaids(response.data.map((r: any) => r.raid)))

  let jobs = await api.endpoints.jobs
    .getAll({ params: headers })
    .then((response) => {
      return response.data
    })

  let jobSkills = await api.allSkills(headers).then((response) => {
    return response.data
  })
  
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
      ...(await serverSideTranslations(locale, ["common"])),
      // Will be passed to the page component as props
    },
  }
}

const organizeRaids = (raids: Raid[]) => {
  // Set up empty raid for "All raids"
  const all = {
    id: "0",
    name: {
      en: "All raids",
      ja: "全て",
    },
    slug: "all",
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

export default PartyRoute
