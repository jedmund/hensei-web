import React, { useState } from 'react'
import classnames from 'classnames'
import UncapIndicator from '~components/UncapIndicator'

import './index.css'

import Plus from '../../../assets/plus.svg'

interface Props {
    onReceiveData: (character: Character, position: number) => void
    character: Character | undefined
    position: number
    editable: boolean
}

const CharacterUnit = (props: Props) => {
    const openModal = () => {}

    const openModalIfEditable = (props.editable) ? openModal : () => {}

    const classes = classnames({
        CharacterUnit: true,
        'editable': props.editable,
        'filled': (props.character !== undefined)
    })

    const character = props.character

    return (
        <div>
            <div className={classes} onClick={openModalIfEditable}>
                <div className="CharacterImage">
                    { (props.editable) ? <span className='icon'><Plus /></span> : '' }
                </div>
                <UncapIndicator 
                    ulb={character?.uncap.ulb || false} 
                    flb={character?.uncap.flb || false}
                    uncapLevel={3}
                />
                <h3 className="CharacterName">{character?.name.en}</h3>
            </div>
        </div>
    )
}

export default CharacterUnit
