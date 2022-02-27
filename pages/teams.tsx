import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import api from '~utils/api'

import GridRep from '~components/GridRep'
import GridRepCollection from '~components/GridRepCollection'
import FilterBar from '~components/FilterBar'

const TeamsRoute: React.FC = () => {
    const router = useRouter()

    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [scrolled, setScrolled] = useState(false)
    const [parties, setParties] = useState<Party[]>([])

    useEffect(() => {
        console.log(`Fetching teams...`)
        fetchTeams()            
    }, [])

    useEffect(() => {
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll);
      }, [])

    async function fetchTeams(element?: number, raid?: string, recency?: number) {
        const params = {
            params: {
                element: (element && element >= 0) ? element : undefined,
                raid: (raid && raid != '0') ? raid : undefined,
                recency: (recency && recency > 0) ? recency : undefined
            }
        }

        api.endpoints.parties.getAll(params)
            .then(response => {
                const parties: Party[] = response.data
                setParties(parties.map((p: any) => p.party).sort((a, b) => (a.created_at > b.created_at) ? -1 : 1))
            })
            .then(() => {
                setFound(true)
                setLoading(false)
            })
            .catch(error => {
                if (error.response != null) {
                    if (error.response.status == 404) {
                        setFound(false)
                    }
                } else {
                    console.error(error)
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
                            shortcode={party.shortcode} 
                            name={party.name}
                            createdAt={new Date(party.created_at)}
                            raid={party.raid}
                            grid={party.weapons}
                            user={party.user}
                            key={`party-${i}`}
                            displayUser={true}
                            onClick={goTo}
                        />
                    })
                }
            </GridRepCollection>
        )
    }

    function renderNoGrids() {
        return (
            <div id="NotFound">
                <h2>No grids found</h2>
            </div>
        )
    }

    return (
        <div id="Teams">
            <FilterBar onFilter={fetchTeams} name="Discover Teams" scrolled={scrolled} />
            { (parties.length > 0) ? renderGrids() : renderNoGrids() }
        </div>
    )
}

export default TeamsRoute