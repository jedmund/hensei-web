import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'

import api from '~utils/api'

import ProfileHeader from '~components/ProfileHeader'
import GridRep from '~components/GridRep'
import GridRepCollection from '~components/GridRepCollection'
import FilterBar from '~components/FilterBar'

const ProfileRoute: React.FC = () => {
    const router = useRouter()
    const { username } = router.query

    const [cookies] = useCookies(['user'])

    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [scrolled, setScrolled] = useState(false)

    const [parties, setParties] = useState<Party[]>([])
    const [user, setUser] = useState<User>({
        id: '',
        username: '',
        granblueId: 0
    })

    // Filter states
    const [element, setElement] = useState<number | null>(null)
    const [raidId, setRaidId] = useState<string | null>(null)
    const [recencyInSeconds, setRecencyInSeconds] = useState<number | null>(null)

    useEffect(() => {
        if (username)
            fetchProfile(username as string)            
    }, [username])

    async function fetchProfile(username: string) {
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

        setLoading(true)

        api.endpoints.users.getOne({ id: username, params: filterParams })
            .then(response => {
                setUser({
                    id: response.data.user.id,
                    username: response.data.user.username,
                    granblueId: response.data.user.granblue_id
                })

                const parties: Party[] = response.data.user.parties
                setParties(parties.sort((a, b) => (a.created_at > b.created_at) ? -1 : 1))
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

    function render() {
        const content = (parties && parties.length > 0) ? renderGrids() : renderNoGrids()
        return (
            <div>
                <ProfileHeader username={user.username} gender={true} />
                {content}
            </div>
        )
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
        <div id="Profile">
            <FilterBar onFilter={receiveFilters} scrolled={scrolled}>
                <div className="UserInfo">
                    <img 
                        alt="Gran"
                        className="gran"
                        srcSet="/profile/gran.png,
                                /profile/gran@2x.png 2x"
                        src="/profile/gran.png" />
                    <h1>{user.username}</h1>
                </div>
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
                                favorited={party.favorited}
                                key={`party-${i}`}
                                onClick={goTo}
                            />
                        })
                    }
                </GridRepCollection>
                { (parties.length == 0) ?
                    <div id="NotFound">
                        <h2>{ (loading) ? 'Loading teams...' : 'No teams found' }</h2>
                    </div> 
                : '' }
            </section>
        </div>
    )
}

export default ProfileRoute