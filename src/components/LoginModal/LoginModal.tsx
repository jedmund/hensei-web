import React from 'react'
import Portal from '../../Portal'

import Modal from '../Modal/Modal'
import Overlay from '../Overlay/Overlay'

const LoginModal = ({ close }) => {
    return (
        <Portal>
            <div>
                <Modal>
                    <input className="Input" name="email" type="text" placeholder="Email address" />
                    <input className="Input" name="password" type="password" placeholder="Password" />
                    <button className="Button">Log in</button>
                </Modal>
                <Overlay onClick={close} />
            </div>
        </Portal>
    )
}

export default LoginModal