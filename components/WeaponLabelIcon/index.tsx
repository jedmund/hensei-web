import React from 'react'

import './index.scss'

interface Props {
    labelType: string
}

class WeaponLabelIcon extends React.Component<Props> {
    render() {
        return (
            <i className={`WeaponLabelIcon ${this.props.labelType}`} />
        )
    }
}

export default WeaponLabelIcon
