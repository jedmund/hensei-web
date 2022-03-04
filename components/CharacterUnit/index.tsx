import React, { useEffect, useState } from 'react'
import classnames from 'classnames'

import SearchModal from '~components/SearchModal'
import UncapIndicator from '~components/UncapIndicator'
import PlusIcon from '~public/icons/Add.svg'

import './index.scss'
import { omit } from 'lodash'
import CharacterHovercard from '~components/CharacterHovercard'

interface Props {
    gridCharacter: GridCharacter | undefined
    position: number
    editable: boolean
    updateObject: (object: Character | Weapon | Summon, position: number) => void
    updateUncap: (id: string, position: number, uncap: number) => void
}

const CharacterUnit = (props: Props) => {
    const [imageUrl, setImageUrl] = useState('')

    const classes = classnames({
        CharacterUnit: true,
        'editable': props.editable,
        'filled': (props.gridCharacter !== undefined)
    })

    const gridCharacter = props.gridCharacter
    const character = gridCharacter?.object

    useEffect(() => {
        generateImageUrl()
    })

    function generateImageUrl() {
        let imgSrc = ""
        
        if (props.gridCharacter) {
            const character = props.gridCharacter.object!

            // Change the image based on the uncap level
            let suffix = '01'
            if (props.gridCharacter.uncap_level == 6)
                suffix = '04'
            else if (props.gridCharacter.uncap_level == 5)
                suffix = '03'
            else if (props.gridCharacter.uncap_level > 2)
                suffix = '02'

            imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-main/${character.granblue_id}_${suffix}.jpg`
        }

        setImageUrl(imgSrc)
    }

    function passUncapData(uncap: number) {
        if (props.gridCharacter)
            props.updateUncap(props.gridCharacter.id, props.position, uncap)
    }

    const image = (
        <div className="CharacterImage">
            <img alt={character?.name.en} className="grid_image" src={imageUrl} />
            { (props.editable) ? <span className='icon'><PlusIcon /></span> : '' }
        </div>
    )

    const editableImage = (
        <SearchModal 
            placeholderText="Search for a character..." 
            fromPosition={props.position} 
            object="characters"
            send={props.updateObject}>
                {image}
        </SearchModal>
    )

    const unitContent = (
        <div className={classes}>
            { (props.editable) ? editableImage : image }
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
    )

    const withHovercard = (
        <CharacterHovercard gridCharacter={gridCharacter!}>
            {unitContent}
        </CharacterHovercard>
    )

    return (
        (gridCharacter) ? withHovercard : unitContent
    )
}

export default CharacterUnit
