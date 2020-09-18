import React from 'react'
import Portal from '~utils/Portal'

import Modal from '~components/Modal/Modal'
import Overlay from '~components/Overlay/Overlay'

import './SignupModal.css'

import New from '../../../assets/new'

interface Props {
    close: () => void
}

const SignupModal = (props: Props) => {
    return (
        <Portal>
            <div>
                <Modal styleName="SignupForm">
                    <div id="ModalTop">
                        <h1>Sign up</h1>
                        <i className='close' onClick={props.close}><New /></i>
                    </div>
                    <form>
                        <div className="fieldset">
                            <input className="Input" name="username" type="text" placeholder="Username" />
                            <input className="Input" name="email" type="text" placeholder="Email address" />
                            <input className="Input" name="password" type="password" placeholder="Password" />
                            <input className="Input" name="confirm_password" type="password" placeholder="Password (again)" />
                        </div>
                        <div id="ModalBottom">
                            <button className="Button">Sign up</button>
                        </div>
                    </form>
                </Modal>
                <Overlay onClick={props.close} />
            </div>
        </Portal>
    )
}

export default SignupModal