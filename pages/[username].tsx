import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'

import { useCookies } from 'react-cookie'
import { queryTypes, useQueryState } from 'next-usequerystate'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import InfiniteScroll from 'react-infinite-scroll-component'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import clonedeep from 'lodash.clonedeep'

import api from '~utils/api'
import { elements, allElement } from '~utils/Element'

import GridRep from '~components/GridRep'
import GridRepCollection from '~components/GridRepCollection'
import FilterBar from '~components/FilterBar'

const emptyUser = {
    id: '',
    username: '',
    granblueId: 0,
    picture: {
        picture: '',
        element: ''
    },
    private: false,
    gender: 0
}

const ProfileRoute: React.FC = () => {
    // Set up cookies
    const [cookies] = useCookies(['account'])
    const headers = (cookies.account) ? {
        'Authorization': `Bearer ${cookies.account.access_token}`
    } : {}

    // Set up router
    const router = useRouter()
    const { username } = router.query

    // Import translations
    const { t } = useTranslation('common')

    // Set up app-specific states
    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [raidsLoading, setRaidsLoading] = useState(true)
    const [scrolled, setScrolled] = useState(false)

    // Set up page-specific states
    const [parties, setParties] = useState<Party[]>([])
    const [raids, setRaids] = useState<Raid[]>()
    const [raid, setRaid] = useState<Raid>()
    const [user, setUser] = useState<User>(emptyUser)

    // Set up infinite scrolling-related states
    const [recordCount, setRecordCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Set up filter-specific query states
    // Recency is in seconds
    const [element, setElement] = useQueryState("element", {
        defaultValue: -1,
        parse: (query: string) => parseElement(query),
        serialize: value => serializeElement(value)
    })
    const [raidSlug, setRaidSlug] = useQueryState("raid", { defaultValue: "all" })
    const [recency, setRecency] = useQueryState("recency", queryTypes.integer.withDefault(-1))

    // Define transformers for element
    function parseElement(query: string) {
        let element: TeamElement | undefined = 
            (query === 'all') ? 
                allElement : elements.find(element => element.name.en.toLowerCase() === query)
        return (element) ? element.id : -1
    }

    function serializeElement(value: number | undefined) {
        let name = ''

        if (value != undefined) {
            if (value == -1)
                name = allElement.name.en.toLowerCase()
            else
                name = elements[value].name.en.toLowerCase()
        }

        return name
    }

    // Add scroll event listener for shadow on FilterBar on mount
    useEffect(() => {
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll);
    }, [])

    // Handle errors
    const handleError = useCallback((error: any) => {
        if (error.response != null) {
            console.error(error)
        } else {
            console.error("There was an error.")
        }
    }, [])

    const fetchProfile = useCallback(({ replace }: { replace: boolean }) => {
        const filters = {
            params: {
                element: (element != -1) ? element : undefined,
                raid: (raid) ? raid.id : undefined,
                recency: (recency != -1) ? recency : undefined,
                page: currentPage
            }
        }

        if (username && !Array.isArray(username))
            api.endpoints.users.getOne({ id: username , params: {...filters, ...{ headers: headers }}})
                .then(response => {
                    setUser({
                        id: response.data.user.id,
                        username: response.data.user.username,
                        granblueId: response.data.user.granblue_id,
                        picture: response.data.user.picture,
                        private: response.data.user.private,
                        gender: response.data.user.gender
                    })

                    setTotalPages(response.data.parties.total_pages)
                    setRecordCount(response.data.parties.count)

                    if (replace)
                        replaceResults(response.data.parties.count, response.data.parties.results)
                    else
                        appendResults(response.data.parties.results)
                })
                .then(() => {
                    setFound(true)
                    setLoading(false)
                })
                .catch(error => handleError(error))
    }, [currentPage, parties, element, raid, recency])

    function replaceResults(count: number, list: Party[]) {
        if (count > 0) {
            setParties(list.sort((a, b) => (a.created_at > b.created_at) ? -1 : 1))
        } else {
            setParties([])
        }
    }

    function appendResults(list: Party[]) {
        setParties([...parties, ...list])
    }

    // Fetch all raids on mount, then find the raid in the URL if present
    useEffect(() => {
        api.endpoints.raids.getAll()
            .then(response => {
                const cleanRaids: Raid[] = response.data.map((r: any) => r.raid)
                setRaids(cleanRaids)

                setRaidsLoading(false)

                const raid = cleanRaids.find(r => r.slug === raidSlug)
                setRaid(raid)

                return raid
            })
    }, [setRaids])

    // When the element, raid or recency filter changes,
    // fetch all teams again.
    useEffect(() => {
        if (!raidsLoading) {
            setCurrentPage(1)
            fetchProfile({ replace: true })
        }
    }, [element, raid, recency])

    useEffect(() => {
        // Current page changed
        if (currentPage > 1)
        fetchProfile({ replace: false })
        else if (currentPage == 1)
        fetchProfile({ replace: true })
    }, [currentPage])

    // Receive filters from the filter bar
    function receiveFilters({ element, raidSlug, recency }: {element?: number, raidSlug?: string, recency?: number}) {
        if (element == 0) 
            setElement(0)
        else if (element) 
            setElement(element)
        
        if (raids && raidSlug) {
            const raid = raids.find(raid => raid.slug === raidSlug)
            setRaid(raid)
            setRaidSlug(raidSlug)
        }

        if (recency) setRecency(recency)
    }

    // Methods: Navigation
    function handleScroll() {
        if (window.pageYOffset > 90)
            setScrolled(true)
        else
            setScrolled(false)
    }

    function goTo(shortcode: string) {
        router.push(`/p/${shortcode}`)
    }

    // TODO: Add save functions

    function renderParties() {
        return parties.map((party, i) => {
            return <GridRep 
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
        })
    }

    return (
        <div id="Profile">
            <Head>
                <title>@{user.username}&apos;s Teams</title>

                <meta property="og:title" content={`@${user.username}\'s Teams`} />
                <meta property="og:description" content={`Browse @${user.username}\'s Teams and filter raid, element or recency`} />
                <meta property="og:url" content={`https://app.granblue.team/${user.username}`} />
                <meta property="og:type" content="website" />

                <meta name="twitter:card" content="summary_large_image" />
                <meta property="twitter:domain" content="app.granblue.team" />
                <meta name="twitter:title" content={`@${user.username}\'s Teams`} />
                <meta name="twitter:description" content={`Browse @${user.username}\''s Teams and filter raid, element or recency`} />
            </Head>
            <FilterBar 
                onFilter={receiveFilters} 
                scrolled={scrolled}
                element={element}
                raidSlug={ (raidSlug) ? raidSlug : undefined }
                recency={recency}>
                    <div className="UserInfo">
                        <img 
                            alt={user.picture.picture}
                            className={`profile ${user.picture.element}`}
                            srcSet={`/profile/${user.picture.picture}.png,
                                    /profile/${user.picture.picture}@2x.png 2x`}
                            src={`/profile/${user.picture.picture}.png`} 
                        />
                        <h1>{user.username}</h1>
                    </div>
            </FilterBar>

            <section>
                <InfiniteScroll
                    dataLength={ (parties && parties.length > 0) ? parties.length : 0}
                    next={ () => setCurrentPage(currentPage + 1) }
                    hasMore={totalPages > currentPage}
                    loader={ <div id="NotFound"><h2>Loading...</h2></div> }>
                        <GridRepCollection loading={loading}>
                            { renderParties() }
                        </GridRepCollection>
                </InfiniteScroll>

                { (parties.length == 0) ?
                    <div id="NotFound">
                        <h2>{ (loading) ? t('teams.loading') : t('teams.not_found') }</h2>
                    </div> 
                : '' }
            </section>
        </div>
    )
}

export async function getStaticPaths() {
    return {
        paths: [
            // Object variant:
            { params: { username: 'string' } },
        ],
        fallback: true,
    }
}

export async function getStaticProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
            // Will be passed to the page component as props
        },
    }
}

export default ProfileRoute
