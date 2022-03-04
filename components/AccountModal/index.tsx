import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useSnapshot } from 'valtio'

import * as Dialog from '@radix-ui/react-dialog'
import * as Switch from '@radix-ui/react-switch'

import api from '~utils/api'
import { accountState } from '~utils/accountState'
import { pictureData } from '~utils/pictureData'

import Button from '~components/Button'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

const AccountModal = () => {
    const { account } = useSnapshot(accountState)

    // Cookies
    const [accountCookies] = useCookies(['account'])
    const [userCookies, setUserCookies] = useCookies(['user'])

    const headers = (accountCookies.account != null) ? {
        headers: {
            'Authorization': `Bearer ${accountCookies.account.access_token}`
        }
    } : {}
    
    // State
    const [open, setOpen] = useState(false)
    const [picture, setPicture] = useState('')
    const [language, setLanguage] = useState('')
    const [privateProfile, setPrivateProfile] = useState(false)

    // Refs
    const pictureSelect = React.createRef<HTMLSelectElement>()
    const languageSelect = React.createRef<HTMLSelectElement>()
    const privateSelect = React.createRef<HTMLInputElement>()

    useEffect(() => {
        if (userCookies.user) setPicture(userCookies.user.picture)
        if (userCookies.user) setLanguage(userCookies.user.language)
    }, [userCookies])

    const pictureOptions = (
            pictureData.sort((a, b) => (a.name.en > b.name.en) ? 1 : -1).map((item, i) => {
            return (
                <option key={`picture-${i}`} value={item.filename}>{item.name.en}</option>
            )
        })
    )

    function handlePictureChange(event: React.ChangeEvent<HTMLSelectElement>) {
        if (pictureSelect.current)
            setPicture(pictureSelect.current.value)
    }

    function handleLanguageChange(event: React.ChangeEvent<HTMLSelectElement>) {
        if (languageSelect.current)
            setLanguage(languageSelect.current.value)
    }

    function handlePrivateChange(checked: boolean) {
        setPrivateProfile(checked)
    }

    function update(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const object = {
            user: {
                picture: picture,
                element: pictureData.find(i => i.filename === picture)?.element,
                language: language,
                private: privateProfile
            }
        }

        api.endpoints.users.update(accountCookies.account.user_id, object, headers)
            .then(response => {
                const user = response.data.user

                const cookieObj = {
                    picture: user.picture.picture,
                    element: user.picture.element,
                    language: user.language,
                }
        
                setUserCookies('user', cookieObj, { path: '/'})

                accountState.account.language = user.language
                accountState.account.user = {
                    id: user.id,
                    username: user.username,
                    picture: user.picture.picture,
                    element: user.picture.element
                }

                setOpen(false)
            })
    }

    function openChange(open: boolean) {
        setOpen(open)
    }

    return (
        <Dialog.Root open={open} onOpenChange={openChange}>
            <Dialog.Trigger asChild>
                <li className="MenuItem">
                    <span>Settings</span>
                </li>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Content className="Account Dialog" onOpenAutoFocus={ (event) => event.preventDefault() }>
                    <div className="DialogHeader">
                        <div className="DialogTop">
                            <Dialog.Title className="SubTitle">Account Settings</Dialog.Title>
                            <Dialog.Title className="DialogTitle">@{account.user?.username}</Dialog.Title>
                        </div>
                        <Dialog.Close className="DialogClose" asChild>
                            <span>
                                <CrossIcon />
                            </span>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={update}>
                        <div className="field">
                            <div className="left">
                                <label>Picture</label>
                            </div>

                            <div className={`preview ${pictureData.find(i => i.filename === picture)?.element}`}>
                                <img 
                                    alt="Profile preview" 
                                    srcSet={`/profile/${picture}.png,
                                             /profile/${picture}@2x.png 2x`}
                                    src={`/profile/${picture}.png`} 
                                />
                            </div>

                            <select name="picture" onChange={handlePictureChange} value={picture} ref={pictureSelect}>
                                {pictureOptions}
                            </select>
                        </div>
                        <div className="field">
                            <div className="left">
                                <label>Language</label>
                            </div>

                            <select name="language" onChange={handleLanguageChange} value={language} ref={languageSelect}>
                                <option key="en" value="en">English</option>
                                <option key="jp" value="jp">Japanese</option>
                            </select>
                        </div>
                        <div className="field">
                            <div className="left">
                                <label>Private</label>
                                <p>Hide your profile and prevent your grids from showing up in collections</p>
                            </div>

                            <Switch.Root className="Switch" onCheckedChange={handlePrivateChange} checked={privateProfile}>
                                <Switch.Thumb className="Thumb" />
                            </Switch.Root>
                        </div>

                        <Button>Save settings</Button>
                    </form>
                </Dialog.Content>
                <Dialog.Overlay className="Overlay" />
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default AccountModal
