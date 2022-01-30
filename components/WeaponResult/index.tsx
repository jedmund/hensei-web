import React from 'react'
import WeaponLabelIcon from '~components/WeaponLabelIcon'

import './index.scss'

interface Props {
    data: Weapon
    onClick: () => void
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']
const Proficiency = ['none', 'sword', 'dagger', 'axe', 'spear', 'bow', 'staff', 'fist', 'harp', 'gun', 'katana']
const Series = ['seraphic', 'grand', 'opus', 'draconic', 'revenant', 'primal', 'beast','regalia', 'omega', 'olden_primal', 'hollowsky', 'xeno', 'astral', 'rose', 'ultima', 'bahamut', 'epic', 'ennead', 'cosmos', 'ancestral', 'superlative', 'vintage', 'class_champion', 'sephira', 'new_world_foundation']

class WeaponResult extends React.Component<Props> {
    render() {
        const weapon = this.props.data

        return (
            <li className="WeaponResult" onClick={this.props.onClick}>
                <img alt={weapon.name.en} src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`} />
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