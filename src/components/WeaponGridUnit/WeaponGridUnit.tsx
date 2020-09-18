import React from 'react'
import classnames from 'classnames'
import { useModal as useModal } from '~utils/useModal'

import SearchModal from '~components/SearchModal/SearchModal'
import UncapIndicator from '~components/UncapIndicator/UncapIndicator'

import gridImages from '../../images/grid/*.jpg'
import Plus from '../../../assets/plus.svg'

import './WeaponGridUnit.css'

function WeaponGridUnit(props: WeaponGridProps) {
    const { open, openModal, closeModal } = useModal()

    let imgSrc
    if (props.weapon) {
        const weapon = props.weapon!

        // Generate the correct source for the weapon
        if (process.env.NODE_ENV === 'development') {
            imgSrc = gridImages[weapon.granblue_id]
        } else if (process.env.NODE_ENV === 'production') {
            imgSrc = `${process.env.SIERO_IMG_URL}/grid/${weapon.granblue_id}.jpg`
        }
    }

    const openModalIfEditable = (props.editable) ? openModal : () => {}

    console.log(props.weapon)
    const classes = classnames({
        WeaponGridUnit: true,
        'editable': props.editable,
        'filled': (props.weapon !== undefined)
    })
    console.log(`Classes: ${classes}`)

    const weapon = props.weapon

    return (
        <li>
            <div className={classes} onClick={openModalIfEditable}>
                <div className="WeaponGridImage">
                    <img className="grid_image" src={imgSrc} />
                    { (props.editable) ? <span className='icon'><Plus /></span> : '' }
                </div>
                <UncapIndicator 
                    ulb={weapon?.uncap.ulb || false} 
                    flb={weapon?.uncap.flb || false}
                    uncapLevel={3}
                />
                <h3 className="WeaponName">{weapon?.name.en}</h3>
            </div>
            {open ? (
                <SearchModal 
                    close={closeModal}
                    send={props.onReceiveData}
                    fromPosition={props.position}
                    placeholderText="Search for a weapon..."
                />
            ) : null}
        </li>
    )
}

export default WeaponGridUnit
