import React from 'react'
import './WeaponResult.css'

import '../WeaponLabelIcon/WeaponLabelIcon'
import WeaponLabelIcon from '../WeaponLabelIcon/WeaponLabelIcon'

import gridImages from '../../images/grid/*.jpg'

interface Weapon {
    id: string
    granblue_id: number
    element: number
    proficiency: number
    max_level: number
    max_skill_level: number
    name: { 
        en: string
        jp: string
    }
    hp: {
        min_hp: number
        max_hp: number
        max_hp_flb: number
        max_hp_ulb: number
    }
    atk: {
        min_atk: number
        max_atk: number
        max_atk_flb: number
        max_atk_ulb: number
    }
    uncap: {
        flb: boolean
        ulb: boolean
    }
}

interface Props {
    data: Weapon
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']
const Proficiency = ['none', 'sword', 'dagger', 'axe', 'spear', 'bow', 'staff', 'fist', 'harp', 'gun', 'katana']


class WeaponResult extends React.Component<Props> {
    render() {
        const weapon = this.props.data
        return (
            <div className="WeaponResult">
                <img alt={weapon.name.en} src={gridImages[weapon.granblue_id]} />
                <div>
                    <div>
                        <h5>{weapon.name.en}</h5>
                        <div className="stars">⭑⭑⭑{(weapon.uncap.flb) ? <span>⭑</span> : ''}{(weapon.uncap.ulb) ? <span>⭑</span> : ''}</div>
                    </div>
                    <WeaponLabelIcon labelType={Element[weapon.element]} />
                    <WeaponLabelIcon labelType={Proficiency[weapon.proficiency]} />
                </div>
            </div>
        )
    }
}

export default WeaponResult