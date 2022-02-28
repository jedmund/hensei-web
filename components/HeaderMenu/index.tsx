import React from 'react'
import Link from 'next/link'

import LoginModal from '~components/LoginModal'
import SignupModal from '~components/SignupModal'

import { useModal as useSignupModal } from '~utils/useModal'
import { useModal as useLoginModal } from '~utils/useModal'
import { useModal as useAboutModal } from '~utils/useModal'

import AboutModal from '~components/AboutModal'

import './index.scss'

interface Props {
    authenticated: boolean,
    username?: string,
    logout?: () => void
}

const HeaderMenu = (props: Props) => {
    const { open: signupOpen, openModal: openSignupModal, closeModal: closeSignupModal } = useSignupModal()
    const { open: loginOpen, openModal: openLoginModal, closeModal: closeLoginModal } = useLoginModal()
    const { open: aboutOpen, openModal: openAboutModal, closeModal: closeAboutModal } = useAboutModal()

    function authItems() {
        return (
            <nav>
                <ul className="Menu auth">
                    <div className="MenuGroup">
                        <li className="MenuItem">
                            <Link href={`/${props.username}` || ''}>{props.username}</Link>
                        </li>
                        <li className="MenuItem">
                            <Link href={`/saved` || ''}>Saved</Link>
                        </li>
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
                        <AboutModal />
                        <li className="MenuItem">
                            <span>Settings</span>
                        </li>
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
                    <li className="MenuItem" onClick={openLoginModal}>
                        <span>Log in</span>
                    </li>
                    {loginOpen ? (
                        <LoginModal 
                            close={closeLoginModal}
                        />
                    ) : null}

                    <li className="MenuItem" onClick={openSignupModal}>
                        <span>Sign up</span>
                    </li>
                    {signupOpen ? (
                        <SignupModal 
                            close={closeSignupModal}
                        />
                    ) : null}
                </div>
                
            </ul>
        )
    }

    return (props.authenticated) ? authItems() : unauthItems()
}

export default HeaderMenu