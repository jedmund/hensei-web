import React, { useEffect } from 'react'
import { useCookies } from 'react-cookie'
import { useRouter } from 'next/router'
import clonedeep from 'lodash.clonedeep'
import { useSnapshot } from 'valtio'

import { accountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'

import Header from '~components/Header'
import Button from '~components/Button'
import HeaderMenu from '~components/HeaderMenu'

const TopHeader = () => {
    const [cookies, _, removeCookie] = useCookies(['user'])

    const accountSnap = useSnapshot(accountState)
    const router = useRouter()

    function copyToClipboard() {
        const el = document.createElement('input')
        el.value = window.location.href
        el.id = 'url-input'
        document.body.appendChild(el)

        el.select()
        document.execCommand('copy')
        el.remove()
    }

    function newParty() {
        // Push the root URL
        router.push('/')

        // Clean state
        const resetState = clonedeep(initialAppState)
        Object.keys(resetState).forEach((key) => {
            appState[key] = resetState[key]
        })

        // Set party to be editable
        appState.party.editable = true
    }

    function logout() {
        removeCookie('user')

        accountState.authorized = false
        appState.party.editable = false

        // TODO: How can we log out without navigating to root
        router.push('/')
        return false
    }

    const leftNav = () => {
        return (
            <div className="dropdown">
                <Button icon="menu">Menu</Button>
                { (accountSnap.account.user) ? 
                    <HeaderMenu authenticated={accountSnap.account.authorized} username={accountSnap.account.user.username} logout={logout} /> :
                    <HeaderMenu authenticated={accountSnap.account.authorized} />
                }
            </div>
        )
    }

    const rightNav = () => {
        return (
            <div>
                { (router.route === '/p/[party]') ? 
                    <Button icon="link" click={copyToClipboard}>Copy link</Button> : ''
                }
                <Button icon="new" click={newParty}>New</Button>
            </div>
        )
    }
        
            
    return (
        <Header 
            position="top"
            left={ leftNav() }
            right={ rightNav() }
        />
    )
}

export default TopHeader