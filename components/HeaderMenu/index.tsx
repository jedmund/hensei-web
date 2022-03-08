import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import Router, { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import Link from 'next/link'
import * as Switch from '@radix-ui/react-switch'

import AboutModal from '~components/AboutModal'
import AccountModal from '~components/AccountModal'
import LoginModal from '~components/LoginModal'
import SignupModal from '~components/SignupModal'

import './index.scss'

interface Props {
    authenticated: boolean,
    username?: string,
    logout?: () => void
}

const HeaderMenu = (props: Props) => {
    const router = useRouter()
    const { t } = useTranslation('common')
    
    const [accountCookies] = useCookies(['account'])
    const [userCookies] = useCookies(['user'])
    const [cookies, setCookies] = useCookies()

    const [checked, setChecked] = useState(false)

    // console.log(`Currently: ${checked} ${cookies['NEXT_LOCALE']}`)

    useEffect(() => {
        const locale = cookies['NEXT_LOCALE']
        setChecked((locale === 'ja') ? true : false)
    }, [cookies])

    function handleCheckedChange(value: boolean) {
        const language = (value) ? 'ja' : 'en'
        setCookies('NEXT_LOCALE', language, { path: '/'})
        router.push(router.asPath, undefined, { locale: language })
    } 

    function authItems() {
        return (
            <nav>
                <ul className="Menu auth">
                    <div className="MenuGroup">
                        <li className="MenuItem profile">
                            <Link href={`/${accountCookies.account.username}` || ''} passHref>
                                <div>
                                    <span>{accountCookies.account.username}</span>
                                    <img 
                                        alt={userCookies.user.picture}
                                        className={`profile ${userCookies.user.element}`}
                                        srcSet={`/profile/${userCookies.user.picture}.png,
                                                /profile/${userCookies.user.picture}@2x.png 2x`}
                                        src={`/profile/${userCookies.user.picture}.png`} 
                                    />
                                </div>
                            </Link>
                        </li>
                        <li className="MenuItem">
                            <Link href={`/saved` || ''}>{t('menu.saved')}</Link>
                        </li>
                    </div>
                    <div className="MenuGroup">
                        <li className="MenuItem">
                            <Link href='/teams'>{t('menu.teams')}</Link>
                        </li>

                        <li className="MenuItem disabled">
                            <div>
                                <span>{t('menu.guides')}</span>
                                <i className="tag">{t('coming_soon')}</i>
                            </div>
                        </li>
                    </div>
                    <div className="MenuGroup">
                        <AboutModal />
                        <AccountModal />
                        <li className="MenuItem" onClick={props.logout}>
                            <span>{t('menu.logout')}</span>
                        </li>
                    </div>
                </ul>
            </nav>
        )
    }

    function unauthItems() {
        return (
            <ul className="Menu unauth">
                <div className="MenuGroup">
                    <li className="MenuItem language">
                        <span>{t('menu.language')}</span>
                        <Switch.Root className="Switch" onCheckedChange={handleCheckedChange} checked={checked}>
                            <Switch.Thumb className="Thumb" />
                            <span className="left">JP</span>
                            <span className="right">EN</span>
                        </Switch.Root>
                    </li>
                </div>
                <div className="MenuGroup">
                    <li className="MenuItem">
                        <Link href='/teams'>{t('menu.teams')}</Link>
                    </li>

                    <li className="MenuItem disabled">
                        <div>
                            <span>{t('menu.guides')}</span>
                            <i className="tag">{t('coming_soon')}</i>
                        </div>
                    </li>
                </div>
                <div className="MenuGroup">
                    <AboutModal />
                </div>
                <div className="MenuGroup">
                    <LoginModal />
                    <SignupModal />
                </div>
            </ul>
        )
    }

    return (props.authenticated) ? authItems() : unauthItems()
}

export default HeaderMenu