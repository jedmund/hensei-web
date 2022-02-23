import React, { MouseEventHandler, useContext, useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useRouter } from 'next/router'

import AppContext from '~context/AppContext'

import * as AlertDialog from '@radix-ui/react-alert-dialog';

import Header from '~components/Header'
import Button from '~components/Button'

import { ButtonType } from '~utils/enums'
import CrossIcon from '~public/icons/Cross.svg'


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
        if (editable && router.route === '/p/[party]') {
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