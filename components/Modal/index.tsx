import React from 'react'
import classnames from 'classnames'

import './index.scss'
import PlusIcon from '~public/icons/Add.svg'

interface Props {
    styleName?: string
    title: string
    close: () => void
}

class Modal extends React.Component<Props> {
    render() {
        return (
            <div className="ModalContainer">
                <div className={classnames("Modal", this.props.styleName)}>
                    <div id="ModalTop">
                        <h2>{this.props.title}</h2>
                        <PlusIcon onClick={this.props.close} />
                    </div>
                    {this.props.children}
                </div>
            </div>
        )
    }
}

export default Modal