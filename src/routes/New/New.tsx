import React from 'react'
import { useCookies } from 'react-cookie'
import SearchModal from '../../components/SearchModal/SearchModal'
import WeaponGrid from '../../components/WeaponGrid/WeaponGrid'

const New = () => {
    const [cookies, setCookie] = useCookies(['userId'])

    return (
        <WeaponGrid userId={cookies.user ? cookies.user.user_id : ''} editable={true} exists={false} />
    )
}

export default New