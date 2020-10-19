import React from 'react'
import WeaponLabelIcon from '~components/WeaponLabelIcon'

import gridImages from '../../images/summon-grid/*.jpg'

import './index.css'

interface Props {
    data: Summon
    onClick: () => void
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']

class SummonResult extends React.Component<Props> {
    render() {
        let imgSrc

        const summon = this.props.data
        if (process.env.NODE_ENV === 'development') {
            imgSrc = gridImages[summon.granblue_id]
        } else if (process.env.NODE_ENV === 'production') {
            imgSrc = `${process.env.SIERO_IMG_URL}/summon-grid/${summon.granblue_id}.jpg`
        }

        return (
            <li className="SummonResult" onClick={this.props.onClick}>
                <img alt={summon.name.en} src={imgSrc} />
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