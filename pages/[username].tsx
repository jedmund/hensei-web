import React, { useCallback, useEffect, useState } from "react"
import Head from "next/head"

import { getCookie } from "cookies-next"
import { queryTypes, useQueryState } from "next-usequerystate"
import { useRouter } from "next/router"
import { useTranslation } from "next-i18next"
import InfiniteScroll from "react-infinite-scroll-component"

import { serverSideTranslations } from "next-i18next/serverSideTranslations"

import api from "~utils/api"
import useDidMountEffect from "~utils/useDidMountEffect"
import { elements, allElement } from "~utils/Element"

import GridRep from "~components/GridRep"
import GridRepCollection from "~components/GridRepCollection"
import FilterBar from "~components/FilterBar"

import type { NextApiRequest, NextApiResponse } from "next"

interface Props {
  user?: User
  teams?: { count: number; total_pages: number; results: Party[] }
  raids: Raid[]
  sortedRaids: Raid[][]
}

const ProfileRoute: React.FC<Props> = (props: Props) => {
  // Set up cookies
  const cookie = getCookie("account")
  const accountData: AccountCookie = cookie
    ? JSON.parse(cookie as string)
    : null
  const headers = accountData
    ? { Authorization: `Bearer ${accountData.token}` }
    : {}

  // Set up router
  const router = useRouter()
  const { username } = router.query

  // Import translations
  const { t } = useTranslation("common")

  // Set up app-specific states
  const [raidsLoading, setRaidsLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)

  // Set up page-specific states
  const [parties, setParties] = useState<Party[]>([])
  const [raids, setRaids] = useState<Raid[]>()
  const [raid, setRaid] = useState<Raid>()

  // Set up infinite scrolling-related states
  const [recordCount, setRecordCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Set up filter-specific query states
  // Recency is in seconds
  const [element, setElement] = useQueryState("element", {
    defaultValue: -1,
    parse: (query: string) => parseElement(query),
    serialize: (value) => serializeElement(value),
  })
  const [raidSlug, setRaidSlug] = useQueryState("raid", { defaultValue: "all" })
  const [recency, setRecency] = useQueryState(
    "recency",
    queryTypes.integer.withDefault(-1)
  )

  // Define transformers for element
  function parseElement(query: string) {
    let element: TeamElement | undefined =
      query === "all"
        ? allElement
        : elements.find((element) => element.name.en.toLowerCase() === query)
    return element ? element.id : -1
  }

  function serializeElement(value: number | undefined) {
    let name = ""

    if (value != undefined) {
      if (value == -1) name = allElement.name.en.toLowerCase()
      else name = elements[value].name.en.toLowerCase()
    }

    return name
  }

  // Set the initial parties from props
  useEffect(() => {
    if (props.teams) {
      setTotalPages(props.teams.total_pages)
      setRecordCount(props.teams.count)
      replaceResults(props.teams.count, props.teams.results)
    }
    setCurrentPage(1)
  }, [])

  // Add scroll event listener for shadow on FilterBar on mount
  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // When the element, raid or recency filter changes,
  // fetch all teams again.
  useDidMountEffect(() => {
    setCurrentPage(1)
    fetchProfile({ replace: true })
  }, [element, raid, recency])

  // When the page changes, fetch all teams again.
  useDidMountEffect(() => {
    // Current page changed
    if (currentPage > 1) fetchProfile({ replace: false })
    else if (currentPage == 1) fetchProfile({ replace: true })
  }, [currentPage])

  // Handle errors
  const handleError = useCallback((error: any) => {
    if (error.response != null) {
      console.error(error)
    } else {
      console.error("There was an error.")
    }
  }, [])

  const fetchProfile = useCallback(
    ({ replace }: { replace: boolean }) => {
      const filters = {
        params: {
          element: element != -1 ? element : undefined,
          raid: raid ? raid.id : undefined,
          recency: recency != -1 ? recency : undefined,
          page: currentPage,
        },
      }

      if (username && !Array.isArray(username))
        api.endpoints.users
          .getOne({
            id: username,
            params: { ...filters, ...{ headers: headers } },
          })
          .then((response) => {
            setTotalPages(response.data.parties.total_pages)
            setRecordCount(response.data.parties.count)

            if (replace)
              replaceResults(
                response.data.parties.count,
                response.data.parties.results
              )
            else appendResults(response.data.parties.results)
          })
          .then(() => {})
          .catch((error) => handleError(error))
    },
    [currentPage, parties, element, raid, recency]
  )

  function replaceResults(count: number, list: Party[]) {
    if (count > 0) {
      setParties(list.sort((a, b) => (a.created_at > b.created_at ? -1 : 1)))
    } else {
      setParties([])
    }
  }

  function appendResults(list: Party[]) {
    setParties([...parties, ...list])
  }

  // Fetch all raids on mount, then find the raid in the URL if present
  useEffect(() => {
    api.endpoints.raids.getAll().then((response) => {
      const cleanRaids: Raid[] = response.data.map((r: any) => r.raid)
      setRaids(cleanRaids)

      setRaidsLoading(false)

      const raid = cleanRaids.find((r) => r.slug === raidSlug)
      setRaid(raid)

      return raid
    })
  }, [setRaids])

  // Receive filters from the filter bar
  function receiveFilters({
    element,
    raidSlug,
    recency,
  }: {
    element?: number
    raidSlug?: string
    recency?: number
  }) {
    if (element == 0) setElement(0)
    else if (element) setElement(element)

    if (raids && raidSlug) {
      const raid = raids.find((raid) => raid.slug === raidSlug)
      setRaid(raid)
      setRaidSlug(raidSlug)
    }

    if (recency) setRecency(recency)
  }

  // Methods: Navigation
  function handleScroll() {
    if (window.pageYOffset > 90) setScrolled(true)
    else setScrolled(false)
  }

  function goTo(shortcode: string) {
    router.push(`/p/${shortcode}`)
  }

  // TODO: Add save functions

  function renderParties() {
    return parties.map((party, i) => {
      return (
        <GridRep
          id={party.id}
          shortcode={party.shortcode}
          name={party.name}
          createdAt={new Date(party.created_at)}
          raid={party.raid}
          grid={party.weapons}
          favorited={party.favorited}
          key={`party-${i}`}
          onClick={goTo}
        />
      )
    })
  }

  return (
    <div id="Profile">
      <Head>
        <title>@{props.user?.username}&apos;s Teams</title>

        <meta
          property="og:title"
          content={`@${props.user?.username}\'s Teams`}
        />
        <meta
          property="og:description"
          content={`Browse @${props.user?.username}\'s Teams and filter raid, element or recency`}
        />
        <meta
          property="og:url"
          content={`https://app.granblue.team/${props.user?.username}`}
        />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="app.granblue.team" />
        <meta
          name="twitter:title"
          content={`@${props.user?.username}\'s Teams`}
        />
        <meta
          name="twitter:description"
          content={`Browse @${props.user?.username}\''s Teams and filter raid, element or recency`}
        />
      </Head>
      <FilterBar
        onFilter={receiveFilters}
        scrolled={scrolled}
        element={element}
        raidSlug={raidSlug ? raidSlug : undefined}
        recency={recency}
      >
        <div className="UserInfo">
          <img
            alt={props.user?.picture.picture}
            className={`profile ${props.user?.picture.element}`}
            srcSet={`/profile/${props.user?.picture.picture}.png,
                                    /profile/${props.user?.picture.picture}@2x.png 2x`}
            src={`/profile/${props.user?.picture.picture}.png`}
          />
          <h1>{props.user?.username}</h1>
        </div>
      </FilterBar>

      <section>
        <InfiniteScroll
          dataLength={parties && parties.length > 0 ? parties.length : 0}
          next={() => setCurrentPage(currentPage + 1)}
          hasMore={totalPages > currentPage}
          loader={
            <div id="NotFound">
              <h2>Loading...</h2>
            </div>
          }
        >
          <GridRepCollection>{renderParties()}</GridRepCollection>
        </InfiniteScroll>
        {parties.length == 0 ? (
          <div id="NotFound">
            <h2>{t("teams.not_found")}</h2>
          </div>
        ) : (
          ""
        )}
      </section>
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
    .getAll(headers)
    .then((response) => organizeRaids(response.data.map((r: any) => r.raid)))

  // Extract recency filter
  const recencyParam: number = parseInt(query.recency)

  // Extract element filter
  const elementParam: string = query.element
  const teamElement: TeamElement | undefined =
    elementParam === "all"
      ? allElement
      : elements.find(
          (element) => element.name.en.toLowerCase() === elementParam
        )

  // Extract raid filter
  const raidParam: string = query.raid
  const raid: Raid | undefined = raids.find((r) => r.slug === raidParam)

  // Create filter object
  const filters: {
    raid?: string
    element?: number
    recency?: number
  } = {}

  if (recencyParam) filters.recency = recencyParam
  if (teamElement && teamElement.id > -1) filters.element = teamElement.id
  if (raid) filters.raid = raid.id

  // Fetch initial set of parties here
  let user: User | null = null
  let teams: Party[] | null = null
  if (query.username) {
    let response = await api.endpoints.users.getOne({
      id: query.username,
      params: { params: { ...filters, ...{ headers: headers } } },
    })

    user = response.data.user
    teams = response.data.parties
  }

  return {
    props: {
      user: user,
      teams: teams,
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

export default ProfileRoute
