import React from 'react'
import WeaponLabelIcon from '~components/WeaponLabelIcon'

import './index.scss'

interface Props {
    data: Character
    onClick: () => void
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']

class CharacterResult extends React.Component<Props> {
    render() {
        const character = this.props.data

        return (
            <li className="CharacterResult" onClick={this.props.onClick}>
                <img alt={character.name.en} src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-grid/${character.granblue_id}_01.jpg`} />
                <div>
                    <div>
                        <h5>{character.name.en}</h5>
                        <div className="stars">{(character.rarity == 2) ? '⭑⭑⭑' : '⭑⭑⭑⭑'}{(character.uncap.flb) ? <span>⭑</span> : ''}</div>
                    </div>
                    <WeaponLabelIcon labelType={Element[character.element]} />
                </div>
            </li>
        )
    }
}

export default CharacterResult