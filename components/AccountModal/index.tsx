import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

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

    const router = useRouter()
    const { t } = useTranslation('common')
    const locale = (router.locale && ['en', 'ja'].includes(router.locale)) ? router.locale : 'en'

    // Cookies
    const [cookies, setCookies] = useCookies()

    const headers = (cookies.account != null) ? {
        headers: {
            'Authorization': `Bearer ${cookies.account.access_token}`
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
        console.log(cookies.user)
        if (cookies.user) setPicture(cookies.user.picture)
        if (cookies.user) setLanguage(cookies.user.language)
    }, [cookies])

    const pictureOptions = (
            pictureData.sort((a, b) => (a.name.en > b.name.en) ? 1 : -1).map((item, i) => {
            return (
                <option key={`picture-${i}`} value={item.filename}>{item.name[locale]}</option>
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

        api.endpoints.users.update(cookies.account.user_id, object, headers)
            .then(response => {
                const user = response.data.user

                const cookieObj = {
                    picture: user.picture.picture,
                    element: user.picture.element,
                    language: user.language,
                }
        
                setCookies('user', cookieObj, { path: '/'})

                accountState.account.user = {
                    id: user.id,
                    username: user.username,
                    picture: user.picture.picture,
                    element: user.picture.element
                }

                setOpen(false)
                changeLanguage(user.language)
            })
    }

    function changeLanguage(newLanguage: string) {
        if (newLanguage !== router.locale) {
            setCookies('NEXT_LOCALE', newLanguage, { path: '/'})
            router.push(router.asPath, undefined, { locale: newLanguage })
        }
    }

    function openChange(open: boolean) {
        setOpen(open)
    }

    return (
        <Dialog.Root open={open} onOpenChange={openChange}>
            <Dialog.Trigger asChild>
                <li className="MenuItem">
                    <span>{t('menu.settings')}</span>
                </li>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Content className="Account Dialog" onOpenAutoFocus={ (event) => event.preventDefault() }>
                    <div className="DialogHeader">
                        <div className="DialogTop">
                            <Dialog.Title className="SubTitle">{t('modals.settings.title')}</Dialog.Title>
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
                                <label>{t('modals.settings.labels.picture')}</label>
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
                                <label>{t('modals.settings.labels.language')}</label>
                            </div>

                            <select name="language" onChange={handleLanguageChange} value={language} ref={languageSelect}>
                                <option key="en" value="en">{t('modals.settings.language.english')}</option>
                                <option key="jp" value="ja">{t('modals.settings.language.japanese')}</option>
                            </select>
                        </div>
                        <div className="field">
                            <div className="left">
                                <label>{t('modals.settings.labels.private')}</label>
                                <p className={locale}>{t('modals.settings.descriptions.private')}</p>
                            </div>

                            <Switch.Root className="Switch" onCheckedChange={handlePrivateChange} checked={privateProfile}>
                                <Switch.Thumb className="Thumb" />
                            </Switch.Root>
                        </div>

                        <Button>{t('modals.settings.buttons.confirm')}</Button>
                    </form>
                </Dialog.Content>
                <Dialog.Overlay className="Overlay" />
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default AccountModal
