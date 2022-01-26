import React, { useEffect, useState } from 'react'
import classnames from 'classnames'

import UncapIndicator from '~components/UncapIndicator'

import PlusIcon from '~public/icons/plus.svg'

import './index.scss'

interface Props {
    onClick: () => void
    character: Character | undefined
    position: number
    editable: boolean
}

const CharacterUnit = (props: Props) => {
    const [imageUrl, setImageUrl] = useState('')

    const classes = classnames({
        CharacterUnit: true,
        'editable': props.editable,
        'filled': (props.character !== undefined)
    })

    const character = props.character

    useEffect(() => {
        generateImageUrl()
    })

    
    function generateImageUrl() {
        let imgSrc = ""
        
        if (props.character) {
            const character = props.character!
            imgSrc = `/images/chara-main/${character.granblue_id}_01.jpg`
        }

        setImageUrl(imgSrc)
    }

    return (
        <div>
            <div className={classes}>
                <div className="CharacterImage" onClick={props.onClick}>
                    <img alt={character?.name.en} className="grid_image" src={imageUrl} />
                    { (props.editable) ? <span className='icon'><PlusIcon /></span> : '' }
                </div>
                <UncapIndicator 
                    type="character"
                    flb={character?.uncap.flb || false}
                    uncapLevel={(character?.rarity == 2) ? 3 : 4}
                />
                <h3 className="CharacterName">{character?.name.en}</h3>
            </div>
        </div>
    )
}

export default CharacterUnit
