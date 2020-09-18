import React from 'react'
import Portal from '~utils/Portal'

import Modal from '~components/Modal/Modal'
import Overlay from '~components/Overlay/Overlay'

const SignupModal = ({ close }) => {
    return (
        <Portal>
            <div>
                <Modal>
                    <input className="Input" name="username" type="text" placeholder="Username" />
                    <input className="Input" name="email" type="text" placeholder="Email address" />
                    <input className="Input" name="password" type="password" placeholder="Password" />
                    <input className="Input" name="confirm_password" type="password" placeholder="Password (again)" />
                    <button className="Button">Sign up</button>
                </Modal>
                <Overlay onClick={close} />
            </div>
        </Portal>
    )
}

export default SignupModal