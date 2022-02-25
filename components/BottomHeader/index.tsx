import React from 'react'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'
import { useSnapshot } from 'valtio'
import clonedeep from 'lodash.clonedeep'
import * as Scroll from 'react-scroll'

import * as AlertDialog from '@radix-ui/react-alert-dialog'

import Header from '~components/Header'
import Button from '~components/Button'

import api from '~utils/api'
import { accountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'

import { ButtonType } from '~utils/enums'
import CrossIcon from '~public/icons/Cross.svg'

const BottomHeader = () => {
    const account = useSnapshot(accountState)
    const app = useSnapshot(appState)

    const router = useRouter()
    const scroll = Scroll.animateScroll;

    // Cookies
    const [cookies] = useCookies(['user'])
    const headers = (cookies.user != null) ? {
        headers: {
            'Authorization': `Bearer ${cookies.user.access_token}`
        }
    } : {}

    function toggleDetails() {
        appState.party.detailsVisible = !appState.party.detailsVisible

        if (appState.party.detailsVisible)
            scroll.scrollToBottom()
        else
            scroll.scrollToTop()
    }

    function deleteTeam(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        if (appState.party.editable && appState.party.id) {
            api.endpoints.parties.destroy(appState.party.id, headers)
                .then(() => {
                    // Push to route
                    router.push('/')

                    // Clean state
                    const resetState = clonedeep(initialAppState)
                    Object.keys(resetState).forEach((key) => {
                        appState[key] = resetState[key]
                    })

                    // Set party to be editable
                    appState.party.editable = true
                })
                .catch((error) => {
                    console.error(error)
                })
        }
    }

    const leftNav = () => {
        if (app.party.detailsVisible) {
            return (<Button icon="edit" active={true} click={toggleDetails}>Hide info</Button>)
        } else {
            return (<Button icon="edit" click={toggleDetails}>Edit info</Button>)
        }
    }

    const rightNav = () => {
        if (app.party.editable && router.route === '/p/[party]') {
            return (
                <AlertDialog.Root>
                <AlertDialog.Trigger className="Button destructive">
                    <span className='icon'>
                        <CrossIcon />
                    </span>
                    <span className="text">Delete team</span>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                <AlertDialog.Overlay className="Overlay" />
                <AlertDialog.Content className="Dialog">
                    <AlertDialog.Title className="DialogTitle">
                        Delete team
                    </AlertDialog.Title>
                    <AlertDialog.Description className="DialogDescription">
                        Are you sure you want to permanently delete this team?
                    </AlertDialog.Description>
                    <div className="actions">
                        <AlertDialog.Cancel className="Button modal">Nevermind</AlertDialog.Cancel>
                        <AlertDialog.Action className="Button modal destructive" onClick={(e) => deleteTeam(e)}>Yes, delete</AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
            )
        } else {
            return (<div />)
        }
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
