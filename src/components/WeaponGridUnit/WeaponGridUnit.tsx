import React from 'react'
import SearchModal from '~components/SearchModal/SearchModal'
import { useModal as useModal } from '~utils/useModal'

import gridImages from '../../images/grid/*.jpg'
import Plus from '../../../assets/plus.svg'

import './WeaponGridUnit.css'

function WeaponGridUnit(props: WeaponGridProps) {
    const { open, openModal, closeModal } = useModal()

    let imgSrc
    if (props.weapon) {
        const weapon = props.weapon!
        imgSrc = gridImages[weapon.granblue_id]
    }

    return (
        <li>
            <div className="WeaponGridUnit" onClick={openModal}>
                <img className="grid_image" src={imgSrc} />
                <span className='icon'><Plus /></span>
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
