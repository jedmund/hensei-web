import React from 'react'
import './UnauthMenu.css'

import LoginModal from '../LoginModal/LoginModal'
import SignupModal from '../SignupModal/SignupModal'

import { useModal as useSignupModal } from '../../useModal'
import { useModal as useLoginModal } from '../../useModal'

function UnauthMenu() {
    const { open: signupOpen, openModal: openSignupModal, closeModal: closeSignupModal } = useSignupModal()
    const { open: loginOpen, openModal: openLoginModal, closeModal: closeLoginModal } = useLoginModal()

    return (
        <ul className="Menu">
            <div className="MenuGroup">
                <li className="MenuItem">About</li>
                <li className="MenuItem">Guides</li>
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

export default UnauthMenu

// if (this.state.loggedIn) {
//     return (
//         <ul className="Menu">
//             <div className="MenuGroup">
//                 <li className="MenuItem">My Parties</li>
//                 <li className="MenuItem">Guides</li>
//                 <li className="MenuItem">About</li>
//             </div>
//             <div className="MenuGroup">
//                 <li className="MenuItem">Log out</li>
//             </div>
//         </ul>
//     )
// } else {