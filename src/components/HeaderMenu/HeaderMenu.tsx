import React from 'react'
import './HeaderMenu.css'

import LoginModal from '~components/LoginModal/LoginModal'
import SignupModal from '~components/SignupModal/SignupModal'

import { useModal as useSignupModal } from '~utils/useModal'
import { useModal as useLoginModal } from '~utils/useModal'
import { Route } from 'react-router'


interface Props {
    username?: string
    navigate: (pathname: string) => void
    logout: () => void
}

const HeaderMenu = (props: Props) => {
    const { open: signupOpen, openModal: openSignupModal, closeModal: closeSignupModal } = useSignupModal()
    const { open: loginOpen, openModal: openLoginModal, closeModal: closeLoginModal } = useLoginModal()

    function authItems() {
        return (
            <ul className="Menu auth">
                <div className="MenuGroup">
                    <li className="MenuItem" onClick={ () => props.username ? props.navigate(props.username) : '' }>My Parties</li>
                </div>
                <div className="MenuGroup">
                    <li className="MenuItem" onClick={ () => props.navigate('about') }>About</li>
                    <li className="MenuItem" onClick={ () => props.navigate('guides') }>Guides</li>
                </div>
                <div className="MenuGroup">
                    <li className="MenuItem" onClick={props.logout}>Logout</li>
                </div>
            </ul>
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