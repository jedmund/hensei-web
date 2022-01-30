import React from 'react'
import WeaponLabelIcon from '~components/WeaponLabelIcon'

import './index.scss'

interface Props {
    data: Summon
    onClick: () => void
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']

class SummonResult extends React.Component<Props> {
    render() {
        const summon = this.props.data

        return (
            <li className="SummonResult" onClick={this.props.onClick}>
                <img alt={summon.name.en} src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblue_id}.jpg`} />
                <div>
                    <div>
                        <h5>{summon.name.en}</h5>
                        <div className="stars">⭑⭑⭑{(summon.uncap.flb) ? <span>⭑</span> : ''}{(summon.uncap.ulb) ? <span>⭑</span> : ''}</div>
                    </div>
                    <WeaponLabelIcon labelType={Element[summon.element]} />
                </div>
            </li>
        )
    }
}

export default SummonResult