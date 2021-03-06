import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import { useModal as useModal } from '~utils/useModal'

import SearchModal from '~components/SearchModal'
import UncapIndicator from '~components/UncapIndicator'

import mainImages from '../../images/weapon-main/*.jpg'
import gridImages from '../../images/weapon-grid/*.jpg'
import Plus from '../../../assets/plus.svg'

import './index.scss'

interface Props {
    onReceiveData: (weapon: Weapon, position: number) => void
    weapon: Weapon | undefined
    position: number
    editable: boolean
    unitType: 0 | 1
}

const WeaponUnit = (props: Props) => {
    const [imageUrl, setImageUrl] = useState('')

    const { open, openModal, closeModal } = useModal()

    const openModalIfEditable = (props.editable) ? openModal : () => {}

    const classes = classnames({
        WeaponUnit: true,
        'mainhand': props.unitType == 0,
        'grid': props.unitType == 1,
        'editable': props.editable,
        'filled': (props.weapon !== undefined)
    })

    const weapon = props.weapon

    useEffect(() => {
        generateImageUrl()
    })

    function generateImageUrl() {
        let imgSrc
        if (props.weapon) {
            const weapon = props.weapon!
    
            // Generate the correct source for the weapon
            if (process.env.NODE_ENV === 'development') {
                if (props.unitType == 0)
                    imgSrc = mainImages[weapon.granblue_id]
                else
                    imgSrc = gridImages[weapon.granblue_id]
            } else if (process.env.NODE_ENV === 'production') {
                if (props.unitType == 0)
                    imgSrc = `${process.env.SIERO_IMG_URL}/weapon-main/${weapon.granblue_id}.jpg`
                else
                    imgSrc = `${process.env.SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`
            }
        }
        
        setImageUrl(imgSrc)
    }

    function sendData(object: Character | Weapon | Summon, position: number) {
        if (isWeapon(object)) {
            props.onReceiveData(object, position)
        }
    }

    function isWeapon(object: Character | Weapon | Summon): object is Weapon {
        return (object as Weapon).proficiency !== undefined
    }

    return (
        <div>
            <div className={classes} onClick={openModalIfEditable}>
                <div className="WeaponImage">
                    { 
                        (imageUrl != '') 
                            ? <img className="grid_image" src={imageUrl} />
                            : <img className="grid_image" />

                    }
                    { (props.editable) ? <span className='icon'><Plus /></span> : '' }
                </div>
                <UncapIndicator 
                    type="weapon"
                    ulb={weapon?.uncap.ulb || false} 
                    flb={weapon?.uncap.flb || false}
                    uncapLevel={3}
                />
                <h3 className="WeaponName">{weapon?.name.en}</h3>
            </div>
            {open ? (
                <SearchModal 
                    close={closeModal}
                    send={sendData}
                    fromPosition={props.position}
                    object="weapons"
                    placeholderText="Search for a weapon..."
                />
            ) : null}
        </div>
    )
}

export default WeaponUnit
