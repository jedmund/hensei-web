import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import api from '~utils/api'

import ProfileHeader from '~components/ProfileHeader'
import GridRep from '~components/GridRep'
import GridRepCollection from '~components/GridRepCollection'

const ProfileRoute: React.FC = () => {
    const router = useRouter()
    const { username } = router.query

    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [parties, setParties] = useState<Party[]>([])
    const [user, setUser] = useState<User>({
        id: '',
        username: '',
        granblueId: 0
    })

    useEffect(() => {
        console.log(`Fetching profile for ${username}...`)
        fetchProfile(username as string)            
    }, [username])

    async function fetchProfile(username: string) {
        api.endpoints.users.getOne({ id: username })
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

    function render() {
        const content = (parties && parties.length > 0) ? renderGrids() : renderNoGrids()
        return (
            <div>
                <ProfileHeader username={user.username} gender={true} />
                {content}
            </div>
        )
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
                            favorited={party.favorited}
                            key={`party-${i}`}
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
                <h2>This user has no grids.</h2>
            </div>
        )
    }

    function renderNotFound() {
        return (
            <div id="NotFound">
                <h2>That user doesn&apos;t exist.</h2>
            </div>
        )
    }

    if (!found && !loading) {
        return renderNotFound()
    } else if (found && !loading) {
        return render()
    } else {
        return (<div />)
    }
}

export default ProfileRoute