import React from 'react'
import classnames from 'classnames'

import './index.scss'

interface Props {
    styleName?: string
}

class Modal extends React.Component<Props> {
    render() {
        return (
            <div className="ModalContainer">
                <div className={classnames("Modal", this.props.styleName)}>
                    {this.props.children}
                </div>
            </div>
        )
    }
}

export default Modal