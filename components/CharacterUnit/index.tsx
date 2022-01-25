import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import classnames from 'classnames'
import { useModal as useModal } from '~utils/useModal'

import SearchModal from '~components/SearchModal'
import UncapIndicator from '~components/UncapIndicator'

import './index.scss'

interface Props {
    onReceiveData: (character: Character, position: number) => void
    character: Character | undefined
    position: number
    editable: boolean
}

const CharacterUnit = (props: Props) => {
    const [imageUrl, setImageUrl] = useState('')
    const { open, openModal, closeModal } = useModal()

    const openModalIfEditable = (props.editable) ? openModal : () => {}

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
            imgSrc = `/images/chara-main/${character.granblue_id}.jpg`
        }

        setImageUrl(imgSrc)
    }

    function sendData(object: Character | Weapon | Summon, position: number) {
        if (isCharacter(object)) {
            props.onReceiveData(object, position)
        }
    }

    function isCharacter(object: Character | Weapon | Summon): object is Character {
        // There aren't really any unique fields here
        return (object as Character).gender !== undefined
    }

    return (
        <div>
            <div className={classes} onClick={openModalIfEditable}>
                <div className="CharacterImage">
                    <img alt={character?.name.en} className="grid_image" src={imageUrl} />
                    { (props.editable) ? <span className='icon'><img src="/icons/plus.svg" /></span> : '' }
                </div>
                <UncapIndicator 
                    type="character"
                    flb={character?.uncap.flb || false}
                    uncapLevel={(character?.rarity == 2) ? 3 : 4}
                />
                <h3 className="CharacterName">{character?.name.en}</h3>
            </div>
            {open ? (
                <SearchModal 
                    close={closeModal}
                    send={sendData}
                    fromPosition={props.position}
                    object="characters"
                    placeholderText="Search for a character..."
                />
            ) : null}
        </div>
    )
}

export default CharacterUnit
