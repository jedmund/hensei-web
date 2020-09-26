import React from 'react'
import './index.css'

import LoginModal from '~components/LoginModal'
import SignupModal from '~components/SignupModal'

import { useModal as useSignupModal } from '~utils/useModal'
import { useModal as useLoginModal } from '~utils/useModal'
import { Link, Route } from 'react-router-dom'
import Profile from '~routes/Profile'


interface Props {
    username?: string
    logout: () => void
}

const HeaderMenu = (props: Props) => {
    const { open: signupOpen, openModal: openSignupModal, closeModal: closeSignupModal } = useSignupModal()
    const { open: loginOpen, openModal: openLoginModal, closeModal: closeLoginModal } = useLoginModal()

    function authItems() {
        return (
            <nav>
                <ul className="Menu auth">
                    <div className="MenuGroup">
                        <li className="MenuItem">
                            <Link to={'/' || ''}>My Parties</Link>
                        </li>
                    </div>
                    <div className="MenuGroup">
                        <li className="MenuItem">
                            <Link to='/about'>About</Link>
                        </li>

                        <li className="MenuItem">
                            <Link to='/guides'>Guides</Link>
                        </li>
                    </div>
                    <div className="MenuGroup">
                        <li className="MenuItem" onClick={props.logout}>Logout</li>
                    </div>
                </ul>
            </nav>
        )
    }

    function unauthItems() {
        return (
            <ul className="Menu unauth">
                <div className="MenuGroup">
                    <li className="MenuItem" onClick={ () => props.navigate('about') }>About</li>
                    <li className="MenuItem" onClick={ () => props.navigate('guides') }>Guides</li>
                </div>
                <div className="MenuGroup">
                    <li className="MenuItem" onClick={openLoginModal}>Log in</li>
                    {loginOpen ? (
                        <LoginModal 
                            close={closeLoginModal}
                        />
                    ) : null}
                    <li className="MenuItem" onClick={openSignupModal}>Sign up</li>
                    {signupOpen ? (
                        <SignupModal 
                            close={closeSignupModal}
                        />
                    ) : null}
                </div>
            </ul>
        )
    }

    return (props.username !== undefined) ? authItems() : unauthItems()
}

export default HeaderMenu