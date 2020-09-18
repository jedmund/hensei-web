import React from 'react'
import Portal from '~utils/Portal'

import Modal from '~components/Modal/Modal'
import Overlay from '~components/Overlay/Overlay'

const LoginModal = (close: () => null ) => {
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