import React from 'react'
import './UnauthMenu.css'


function UnauthMenu() {

    return (
        <ul className="Menu">
            <div className="MenuGroup">
                <li className="MenuItem">About</li>
                <li className="MenuItem">Guides</li>
            </div>
            <div className="MenuGroup">
                <li className="MenuItem" onClick={openLoginModal}>Log in</li>
                <li className="MenuItem" onClick={openSignupModal}>Sign up</li>
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