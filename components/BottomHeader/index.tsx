import React from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'

import * as AlertDialog from '@radix-ui/react-alert-dialog';

import Header from '~components/Header'
import Button from '~components/Button'

import { accountState } from '~utils/accountState'
import { appState } from '~utils/appState'

import { ButtonType } from '~utils/enums'
import CrossIcon from '~public/icons/Cross.svg'


const BottomHeader = () => {
    const account = useSnapshot(accountState)
    const app = useSnapshot(appState)

    const router = useRouter()

    function deleteTeam(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        // TODO: Implement deleting teams
        console.log("Deleting team...")
    }

    const leftNav = () => {
        return (
            <Button icon="edit" click={() => {}}>Add more info</Button>
        )
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