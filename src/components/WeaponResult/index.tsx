import React from 'react'
import WeaponLabelIcon from '~components/WeaponLabelIcon'

import gridImages from '../../images/weapon-grid/*.jpg'

import './index.css'

interface Props {
    data: Weapon
    onClick: () => void
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']
const Proficiency = ['none', 'sword', 'dagger', 'axe', 'spear', 'bow', 'staff', 'fist', 'harp', 'gun', 'katana']

class WeaponResult extends React.Component<Props> {
    render() {
        let imgSrc

        const weapon = this.props.data
        if (process.env.NODE_ENV === 'development') {
            imgSrc = gridImages[weapon.granblue_id]
        } else if (process.env.NODE_ENV === 'production') {
            imgSrc = `${process.env.SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`
        }

        return (
            <li className="WeaponResult" onClick={this.props.onClick}>
                <img alt={weapon.name.en} src={imgSrc} />
                <div>
                    <div>
                        <h5>{weapon.name.en}</h5>
                        <div className="stars">⭑⭑⭑{(weapon.uncap.flb) ? <span>⭑</span> : ''}{(weapon.uncap.ulb) ? <span>⭑</span> : ''}</div>
                    </div>
                    <WeaponLabelIcon labelType={Element[weapon.element]} />
                    <WeaponLabelIcon labelType={Proficiency[weapon.proficiency]} />
                </div>
            </li>
        )
    }
}

export default WeaponResult