import React, { useEffect, useState } from 'react'
import { withCookies, useCookies } from 'react-cookie'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import api from '~utils/api'

interface Props {
    username: string
}

interface User {
    id: string
    username: string
    granblueId: number
}

interface ProfileProps extends RouteComponentProps<Props> {}

const Profile: React.FC<ProfileProps> = ({ match }) => {
    const [cookies, setCookie] = useCookies(['user'])
    const [user, setUser] = useState<User>({
        id: '',
        username: '',
        granblueId: 0
    })
    const [parties, setParties] = useState<GridArray[]>([])

    const username = match.params.username || ''

    useEffect(() => {
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
    }

    return (
        <div>
            <h1>{user.username}</h1>
        </div>
    )
}

export default 
    withCookies(
        withRouter(
            Profile
        )
    )