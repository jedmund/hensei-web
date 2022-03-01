import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'
import clonedeep from 'lodash.clonedeep'

import api from '~utils/api'

import GridRep from '~components/GridRep'
import GridRepCollection from '~components/GridRepCollection'
import FilterBar from '~components/FilterBar'

const TeamsRoute: React.FC = () => {
    const router = useRouter()

    // Cookies
    const [cookies] = useCookies(['user'])
    const headers = (cookies.user != null) ? {
        'Authorization': `Bearer ${cookies.user.access_token}`
    } : {}

    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [scrolled, setScrolled] = useState(false)

    const [parties, setParties] = useState<Party[]>([])

    const [element, setElement] = useState<number | null>(null)
    const [raidId, setRaidId] = useState<string | null>(null)
    const [recencyInSeconds, setRecencyInSeconds] = useState<number | null>(null)

    useEffect(() => {
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll);
    }, [])

    const handleError = useCallback((error: any) => {
        if (error.response != null && error.response.status == 404) {
            setFound(false)
        } else if (error.response != null) {
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
                'Authorization': `Bearer ${cookies.user?.access_token}`
            }
        }

        api.endpoints.parties.getAll(filterParams)
            .then(response => {
                const parties: Party[] = response.data
                setParties(parties.map((p: any) => p.party).sort((a, b) => (a.created_at > b.created_at) ? -1 : 1))
            })
            .then(() => {
                setFound(true)
                setLoading(false)
            })
            .catch(error => handleError(error))
    }, [element, raidId, recencyInSeconds, cookies.user, handleError])

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
                    clonedParties[index] = party

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
    
    function renderGrids() {
        return (
            <GridRepCollection>
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
        )
    }

    function renderNoGrids() {
        return (
            <div id="NotFound">
                <h2>No teams found</h2>
            </div>
        )
    }

    return (
        <div id="Teams">
            <FilterBar onFilter={receiveFilters} name="Discover Teams" scrolled={scrolled} />
            { (parties.length > 0) ? renderGrids() : renderNoGrids() }
        </div>
    )
}

export default TeamsRoute