import React from 'react'
import WeaponLabelIcon from '~components/WeaponLabelIcon'

import images from '../../images/chara-grid/*.jpg'

import './index.scss'

interface Props {
    data: Character
    onClick: () => void
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']

class CharacterResult extends React.Component<Props> {
    render() {
        let imgSrc

        const character = this.props.data
        if (process.env.NODE_ENV === 'development') {
            imgSrc = images[character.granblue_id]
        } else if (process.env.NODE_ENV === 'production') {
            imgSrc = `${process.env.REACT_APP_SIERO_IMG_URL}/chara-grid/${character.granblue_id}.jpg`
        }

        return (
            <li className="CharacterResult" onClick={this.props.onClick}>
                <img alt={character.name.en} src={imgSrc} />
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