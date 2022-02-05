import React, { useContext, useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useRouter } from 'next/router'

import AppContext from '~context/AppContext'

import Header from '~components/Header'
import Button from '~components/Button'

import { ButtonType } from '~utils/enums'

const BottomHeader = () => {
    const { editable, setEditable, authenticated, setAuthenticated } = useContext(AppContext)

    const [username, setUsername] = useState(undefined)
    const [cookies, _, removeCookie] = useCookies(['user'])

    const router = useRouter()

    useEffect(() => {
        if (cookies.user) {
            setAuthenticated(true)
            setUsername(cookies.user.username)
        } else {
            setAuthenticated(false)
        }
    }, [cookies, setUsername, setAuthenticated])

    const leftNav = () => {
        return (
            <Button icon="edit" click={() => {}}>Add more info</Button>
        )
    }

    const rightNav = () => {
        return (
            <div>
                { (editable && router.route === '/p/[party]') ?
                    <Button icon="cross" type={ButtonType.Destructive} click={() => {}}>Delete team</Button> : ''
                }
            </div>
        )
    }
        
            
    return (
        <Header 
            position="bottom"
            left={ leftNav() }
            right={ rightNav() }
        />
    )
}

export default BottomHeader