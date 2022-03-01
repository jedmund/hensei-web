import React from 'react'
import UncapIndicator from '~components/UncapIndicator'
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
                <div className="Info">
                    <h5>{character.name.en}</h5>
                    <UncapIndicator 
                        type="character"
                        flb={character.uncap.flb}
                        ulb={character.uncap.ulb}
                        special={character.special}
                    />
                    <div className="tags">
                        <WeaponLabelIcon labelType={Element[character.element]} />
                    </div>
                </div>
            </li>
        )
    }
}

export default CharacterResult