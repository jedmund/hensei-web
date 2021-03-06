import React, { useEffect, useState } from 'react'
import { withCookies, useCookies } from 'react-cookie'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import api from '~utils/api'

import GridRep from '~components/GridRep'
import GridRepCollection from '~components/GridRepCollection'
import { composeInitialProps } from 'react-i18next'

interface Props {
    username: string
}

interface User {
    id: string
    username: string
    granblueId: number
}

interface Party {
    id: string
    shortcode: string
    weapons: GridWeapon[]
}

interface ProfileProps extends RouteComponentProps<Props> {}

const ProfileRoute: React.FC<ProfileProps> = ({ history, match }) => {
    const [cookies, setCookie] = useCookies(['user'])

    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [parties, setParties] = useState<Party[]>([])
    const [user, setUser] = useState<User>({
        id: '',
        username: '',
        granblueId: 0
    })

    const username = match.params.username || ''

    useEffect(() => {
        console.log(`Fetching profile for ${username}...`)
        fetchProfile(username)            
    }, [])

    async function fetchProfile(username: string) {
        api.endpoints.users.getOne({ id: username })
            .then(response => {
                setUser({
                    id: response.data.user.id,
                    username: response.data.user.username,
                    granblueId: response.data.user.granblue_id
                })
                setParties(response.data.user.parties)
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
                <h1>{user.username}</h1>
                {content}
            </div>
        )
    }

    function navigate(shortcode: string) {
        history.push(`/p/${shortcode}`)
    }
    
    function renderGrids() {
        return (
            <GridRepCollection>
                {
                    parties.map((party, i) => {
                        return <GridRep 
                            shortcode={party.shortcode} 
                            grid={party.weapons}
                            key={`party-${i}`}
                            onClick={navigate}
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
                <h2>That user doesn't exist.</h2>
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

export default 
    withCookies(
        withRouter(
            ProfileRoute
        )
    )