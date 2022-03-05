import React from 'react'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

import clonedeep from 'lodash.clonedeep'
import * as Scroll from 'react-scroll'

import * as AlertDialog from '@radix-ui/react-alert-dialog'

import Header from '~components/Header'
import Button from '~components/Button'

import api from '~utils/api'
import { appState, initialAppState } from '~utils/appState'

import CrossIcon from '~public/icons/Cross.svg'

const BottomHeader = () => {
    const { t } = useTranslation('common')

    const app = useSnapshot(appState)

    const router = useRouter()
    const scroll = Scroll.animateScroll;

    // Cookies
    const [cookies] = useCookies(['account'])
    const headers = (cookies.account != null) ? {
        headers: {
            'Authorization': `Bearer ${cookies.account.access_token}`
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
            api.endpoints.parties.destroy({ id: appState.party.id, params: headers })
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
        if (router.pathname === '/p/[party]' || router.pathname === '/new') {
            if (app.party.detailsVisible) {
                return (<Button icon="edit" active={true} onClick={toggleDetails}>{t('buttons.hide_info')}</Button>)
            } else {
                return (<Button icon="edit" onClick={toggleDetails}>{t('buttons.show_info')}</Button>)
            }
        } else {
            return (<div />)
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
                    <span className="text">{t('buttons.delete')}</span>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                <AlertDialog.Overlay className="Overlay" />
                <AlertDialog.Content className="Dialog">
                    <AlertDialog.Title className="DialogTitle">
                        {t('delete_team.title')}
                    </AlertDialog.Title>
                    <AlertDialog.Description className="DialogDescription">
                        {t('delete_team.description')}
                    </AlertDialog.Description>
                    <div className="actions">
                        <AlertDialog.Cancel className="Button modal">{t('delete_team.buttons.cancel')}</AlertDialog.Cancel>
                        <AlertDialog.Action className="Button modal destructive" onClick={(e) => deleteTeam(e)}>{t('delete_team.buttons.confirm')}</AlertDialog.Action>
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
