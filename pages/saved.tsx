import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'
import clonedeep from 'lodash.clonedeep'

import api from '~utils/api'

import GridRep from '~components/GridRep'
import GridRepCollection from '~components/GridRepCollection'
import FilterBar from '~components/FilterBar'

const SavedRoute: React.FC = () => {
    const router = useRouter()
    
    // Cookies
    const [cookies] = useCookies(['account'])
    const headers = (cookies.account != null) ? {
        'Authorization': `Bearer ${cookies.account.access_token}`
    } : {}

    const [loading, setLoading] = useState(true)
    const [scrolled, setScrolled] = useState(false)

    const [parties, setParties] = useState<Party[]>([])

    // Filter states
    const [element, setElement] = useState<number | null>(null)
    const [raidId, setRaidId] = useState<string | null>(null)
    const [recencyInSeconds, setRecencyInSeconds] = useState<number | null>(null)

    useEffect(() => {
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll);
    }, [])

    const handleError = useCallback((error: any) => {
        if (error.response != null) {
            console.error(error)
        } else {
            console.error("There was an error.")
        }
    }, [])

    const fetchTeams = useCallback(() => {
        const filterParams = {
            params: {
                element: element,
                raid: raidId,
                recency: recencyInSeconds
            },
            headers: {
                'Authorization': `Bearer ${cookies.account.access_token}`
            }
        }

        setLoading(true)

        api.savedTeams(filterParams)
            .then(response => {
                const parties: Party[] = response.data
                setParties(parties.map((p: any) => p.party).sort((a, b) => (a.created_at > b.created_at) ? -1 : 1))
            })
            .then(() => {
                setLoading(false)
            })
            .catch(error => handleError(error))
    }, [element, raidId, recencyInSeconds, cookies.account, handleError])

    useEffect(() => {
        fetchTeams()           
    }, [fetchTeams])

    function receiveFilters(element?: number, raid?: string, recency?: number) {
        if (element != null && element >= 0)
            setElement(element)
        else
            setElement(null)

        if (raid && raid != '0')
            setRaidId(raid)
        else
            setRaidId(null)

        if (recency && recency > 0)
            setRecencyInSeconds(recency)
        else
            setRecencyInSeconds(null)
    }

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

    function handleScroll() {
        if (window.pageYOffset > 90)
            setScrolled(true)
        else
            setScrolled(false)
    }

    function goTo(shortcode: string) {
        router.push(`/p/${shortcode}`)
    }

    return (
        <div id="Teams">
            <Head>
                <title>Your saved Teams</title>

                <meta property="og:title" content="Your saved Teams" />
                <meta property="og:url" content="https://app.granblue.team/saved" />
                <meta property="og:type" content="website" />

                <meta name="twitter:card" content="summary_large_image" />
                <meta property="twitter:domain" content="app.granblue.team" />
                <meta name="twitter:title" content="Your saved Teams" />
            </Head>

            <FilterBar onFilter={receiveFilters} scrolled={scrolled}>
                <h1>Your saved Teams</h1>
            </FilterBar>
            
            <section>
                <GridRepCollection loading={loading}>
                    {
                        parties.map((party, i) => {
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
                                onSave={toggleFavorite}
                            />
                        })
                    }
                </GridRepCollection>

                { (parties.length == 0) ?
                    <div id="NotFound">
                        <h2>{ (loading) ? 'Loading saved teams...' : 'You haven&apos;t saved any teams yet' }</h2>
                    </div> 
                : '' }
            </section>
        </div>
    )
}

export default SavedRoute