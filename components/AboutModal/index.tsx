import React from 'react'
import { createPortal } from 'react-dom'
import api from '~utils/api'

import Modal from '~components/Modal'
import Overlay from '~components/Overlay'

import './index.module.css'

interface Props {
    close: () => void
}

const AboutModal = (props: Props) => {
    const about = (
        <div>
            <p>Siero is a tool to save and share parties for Granblue Fantasy.</p>
            <p>All you need to do to get started is start adding things. Siero will make a URL and you can share your party with the world.</p>
            <p>If you want to save your parties for safe keeping or to edit them later, you can make a free account.</p>
        </div>
    )
    return (
        createPortal(
            <div>
                <Modal styleName="AboutModal">
                    {about}
                </Modal>
                <Overlay onClick={props.close} />
            </div>,
            document.body
        )
    )
}

export default AboutModal