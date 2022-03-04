import React from 'react'
import Link from 'next/link'
import { useSnapshot } from 'valtio'

import { accountState } from '~utils/accountState'

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
    const { account } = useSnapshot(accountState)
    function authItems() {
        return (
            <nav>
                <ul className="Menu auth">
                    <div className="MenuGroup">
                        <li className="MenuItem">
                            <Link href={`/${account.user?.username}` || ''}>{account.user?.username}</Link>
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

                        <li className="MenuItem">
                            <Link href='/guides'>Guides</Link>
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