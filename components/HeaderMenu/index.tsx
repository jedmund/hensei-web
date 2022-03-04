import React from 'react'
import Link from 'next/link'
import { useCookies } from 'react-cookie'

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
    
    const [cookies] = useCookies()

    function authItems() {
        return (
            <nav>
                <ul className="Menu auth">
                    <div className="MenuGroup">
                        <li className="MenuItem profile">
                            <Link href={`/${cookies.user?.username}` || ''}>
                                <div>
                                    <span>{cookies.user?.username}</span>
                                    <img 
                                        alt={cookies.user?.picture}
                                        className={`profile ${cookies.user?.element}`}
                                        srcSet={`/profile/${cookies.user?.picture}.png,
                                                /profile/${cookies.user?.picture}@2x.png 2x`}
                                        src={`/profile/${cookies.user?.picture}.png`} 
                                    />
                                </div
                            ></Link>
                        </li>
                        <li className="MenuItem">
                            <Link href={`/saved` || ''}>Saved</Link>
                        </li>
                    </div>
                    <div className="MenuGroup">
                        <li className="MenuItem">
                            <Link href='/teams'>Teams</Link>
                        </li>

                        <li className="MenuItem disabled">
                            <div>
                                <span>Guides</span>
                                <i className="tag">Coming Soon</i>
                            </div>
                        </li>
                    </div>
                    <div className="MenuGroup">
                        <AboutModal />
                        <AccountModal />
                        <li className="MenuItem" onClick={props.logout}>
                            <span>Logout</span>
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
                    <AboutModal />
                </div>
                <div className="MenuGroup">
                        <li className="MenuItem">
                            <Link href='/teams'>Teams</Link>
                        </li>

                        <li className="MenuItem disabled">
                            <div>
                                <span>Guides</span>
                                <i className="tag">Coming Soon</i>
                            </div>
                        </li>
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