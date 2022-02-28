import React, { useEffect } from 'react'
import { useCookies } from 'react-cookie'
import { useRouter } from 'next/router'
import clonedeep from 'lodash.clonedeep'
import { useSnapshot } from 'valtio'

import api from '~utils/api'
import { accountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'

import Header from '~components/Header'
import Button from '~components/Button'
import HeaderMenu from '~components/HeaderMenu'

const TopHeader = () => {
    // Cookies
    const [cookies, _, removeCookie] = useCookies(['user'])
    const headers = (cookies.user != null) ? {
        'Authorization': `Bearer ${cookies.user.access_token}`
    } : {}

    const { account } = useSnapshot(accountState)
    const { party } = useSnapshot(appState)
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

    function toggleFavorite() {
        if (party.favorited)
            unsaveFavorite()
        else
            saveFavorite()
    }

    function saveFavorite() {
        if (party.id)
            api.saveTeam({ id: party.id, params: headers })
                .then((response) => {
                    if (response.status == 201)
                        appState.party.favorited = true
                })
        else
            console.error("Failed to save team: No party ID")
    }

    function unsaveFavorite() {
        if (party.id)
            api.unsaveTeam({ id: party.id, params: headers })
                .then((response) => {
                    if (response.status == 200)
                        appState.party.favorited = false
                })
        else
            console.error("Failed to unsave team: No party ID")
    }

    const leftNav = () => {
        return (
            <div className="dropdown">
                <Button icon="menu">Menu</Button>
                { (account.user) ? 
                    <HeaderMenu authenticated={account.authorized} username={account.user.username} logout={logout} /> :
                    <HeaderMenu authenticated={account.authorized} />
                }
            </div>
        )
    }

    const saveButton = () => {
        if (party.favorited)
            return (<Button icon="save" active={true} click={toggleFavorite}>Saved</Button>)
        else
            return (<Button icon="save" click={toggleFavorite}>Save</Button>)
    }

    const rightNav = () => {
        return (
            <div>
                { (router.route === '/p/[party]' && account.user && (!party.user || party.user.id !== account.user.id)) ? 
                    saveButton() : ''
                }
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