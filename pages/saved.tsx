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

const SavedRoute: React.FC = () => {
    // Set up cookies
    const [cookies] = useCookies(['account'])
    const headers = (cookies.account) ? {
        'Authorization': `Bearer ${cookies.account.access_token}`
    } : {}

    // Set up router
    const router = useRouter()

    // Import translations
    const { t } = useTranslation('common')

    // Set up app-specific states
    const [loading, setLoading] = useState(true)
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

    const fetchTeams = useCallback(({ replace }: { replace: boolean }) => {
        const filters = {
            params: {
                element: (element != -1) ? element : undefined,
                raid: (raid) ? raid.id : undefined,
                recency: (recency != -1) ? recency : undefined,
                page: currentPage
            }
        }

        api.savedTeams({...filters, ...{ headers: headers }})
            .then(response => {
                setTotalPages(response.data.total_pages)
                setRecordCount(response.data.count)

                if (replace)
                    replaceResults(response.data.count, response.data.results)
                else
                    appendResults(response.data.results)
            })
            .then(() => {
                setLoading(false)
            })
            .catch(error => handleError(error))
    }, [currentPage, parties, element, raid, recency])

    function replaceResults(count: number, list: Party[]) {
        if (count > 0) {
            setParties(list)
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
            fetchTeams({ replace: true })
        }
    }, [element, raid, recency])

    useEffect(() => {
        // Current page changed
        if (currentPage > 1)
            fetchTeams({ replace: false })
        else if (currentPage == 1)
            fetchTeams({ replace: true })
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

    // Methods: Favorites
    function toggleFavorite(teamId: string, favorited: boolean) {
        if (favorited)
            unsaveFavorite(teamId)
        else
            saveFavorite(teamId)
    }

    function saveFavorite(teamId: string) {
        api.saveTeam({ id: teamId, params: headers })
            .then((response) => {
                if (response.status == 201) {
                    const index = parties.findIndex(p => p.id === teamId)
                    const party = parties[index]

                    party.favorited = true

                    let clonedParties = clonedeep(parties)
                    clonedParties[index] = party

                    setParties(clonedParties)
                }
            })
    }

    function unsaveFavorite(teamId: string) {
        api.unsaveTeam({ id: teamId, params: headers })
            .then((response) => {
                if (response.status == 200) {
                    const index = parties.findIndex(p => p.id === teamId)
                    const party = parties[index]

                    party.favorited = false

                    let clonedParties = clonedeep(parties)
                    clonedParties.splice(index, 1)

                    setParties(clonedParties)
                }
            })
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

    function renderParties() {
        return parties.map((party, i) => {
            return <GridRep 
                id={party.id}
                shortcode={party.shortcode} 
                name={party.name}
                createdAt={new Date(party.created_at)}
                raid={party.raid}
                grid={party.weapons}
                user={party.user}
                favorited={party.favorited}
                key={`party-${i}`}
                displayUser={true}
                onClick={goTo}
                onSave={toggleFavorite} />
        })
    }

    return (
        <div id="Teams">
            <Head>
                <title>{t('saved.title')}</title>

                <meta property="og:title" content="Your saved Teams" />
                <meta property="og:url" content="https://app.granblue.team/saved" />
                <meta property="og:type" content="website" />

                <meta name="twitter:card" content="summary_large_image" />
                <meta property="twitter:domain" content="app.granblue.team" />
                <meta name="twitter:title" content="Your saved Teams" />
            </Head>

            <FilterBar 
                onFilter={receiveFilters} 
                scrolled={scrolled}
                element={element}
                raidSlug={ (raidSlug) ? raidSlug : undefined }
                recency={recency}>
                    <h1>{t('saved.title')}</h1>
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
                        <h2>{ (loading) ? t('saved.loading') : t('saved.not_found') }</h2>
                    </div> 
                : '' }
            </section>
        </div>
    )
}

export async function getStaticProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
            // Will be passed to the page component as props
        },
    }
}

export default SavedRoute