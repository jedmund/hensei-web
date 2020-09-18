import React from 'react'
import Portal from '~utils/Portal'

import Modal from '~components/Modal/Modal'
import Overlay from '~components/Overlay/Overlay'

import './LoginForm.css'

import New from '../../../assets/new'

interface Props {
    close: () => void
}

const LoginModal = (props: Props) => {
    return (
        <Portal>
            <div>
                <Modal styleName="LoginForm">
                    <div id="ModalTop">
                        <h1>Log in</h1>
                        <i className='close' onClick={props.close}><New /></i>
                    </div>
                    <form>
                        <div className="fieldset">
                            <input className="Input" name="email" type="text" placeholder="Email address" />
                            <input className="Input" name="password" type="password" placeholder="Password" />
                        </div>
                        <div id="ModalBottom">
                            <a>Forgot your password?</a>
                            <button className="Button">Log in</button>
                        </div>
                    </form>
                </Modal>
                <Overlay onClick={props.close} />
            </div>
        </Portal>
    )
}

export default LoginModal