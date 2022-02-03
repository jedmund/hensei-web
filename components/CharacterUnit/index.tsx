import React, { useEffect, useState } from 'react'
import classnames from 'classnames'

import UncapIndicator from '~components/UncapIndicator'
import PlusIcon from '~public/icons/plus.svg'

import './index.scss'

interface Props {
    gridCharacter: GridCharacter | undefined
    position: number
    editable: boolean
    onClick: () => void
    updateUncap: (id: string, position: number, uncap: number) => void
}

const CharacterUnit = (props: Props) => {
    console.log(props.gridCharacter?.character.name.en, props.gridCharacter?.uncap_level)

    const [imageUrl, setImageUrl] = useState('')

    const classes = classnames({
        CharacterUnit: true,
        'editable': props.editable,
        'filled': (props.gridCharacter !== undefined)
    })

    const gridCharacter = props.gridCharacter
    const character = gridCharacter?.character

    useEffect(() => {
        generateImageUrl()
    })

    function generateImageUrl() {
        let imgSrc = ""
        
        if (props.gridCharacter) {
            const character = props.gridCharacter.character!
            imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-main/${character.granblue_id}_01.jpg`
        }

        setImageUrl(imgSrc)
    }

    function passUncapData(uncap: number) {
        console.log(`passuncapdata ${uncap}`)
        if (props.gridCharacter)
            props.updateUncap(props.gridCharacter.id, props.position, uncap)
    }

    return (
        <div>
            <div className={classes}>
                <div className="CharacterImage" onClick={ (props.editable) ? props.onClick : () => {} }>
                    <img alt={character?.name.en} className="grid_image" src={imageUrl} />
                    { (props.editable) ? <span className='icon'><PlusIcon /></span> : '' }
                </div>
                { (gridCharacter && character) ? 
                    <UncapIndicator 
                        type="character"
                        flb={character.uncap.flb || false}
                        ulb={character.uncap.ulb || false}
                        uncapLevel={gridCharacter.uncap_level}
                        updateUncap={passUncapData}
                        special={character.special}
                    /> : '' }
                <h3 className="CharacterName">{character?.name.en}</h3>
            </div>
        </div>
    )
}

export default CharacterUnit
