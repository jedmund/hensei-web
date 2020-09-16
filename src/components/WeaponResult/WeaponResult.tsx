import React from 'react'
import './WeaponResult.css'

import '../WeaponLabelIcon/WeaponLabelIcon'
import WeaponLabelIcon from '../WeaponLabelIcon/WeaponLabelIcon'

import gridImages from '../../images/grid/*.jpg'

interface Props {
    data: Weapon
    onClick: () => void
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']
const Proficiency = ['none', 'sword', 'dagger', 'axe', 'spear', 'bow', 'staff', 'fist', 'harp', 'gun', 'katana']

class WeaponResult extends React.Component<Props> {
    render() {
        const weapon = this.props.data
        return (
            <li className="WeaponResult" onClick={this.props.onClick}>
                <img alt={weapon.name.en} src={gridImages[weapon.granblue_id]} />
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