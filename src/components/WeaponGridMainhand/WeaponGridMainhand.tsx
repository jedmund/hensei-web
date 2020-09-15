import React, { useEffect, useState } from 'react'
import './WeaponGridMainhand.css'

import SearchModal from '../SearchModal/SearchModal'
import { useModal as useModal } from '../../useModal'

import mainhandImages from '../../images/mainhand/*.jpg'
import Plus from '../../../assets/plus.svg'

function WeaponGridUnit() {
    const { open, openModal, closeModal } = useModal()
    const [weapon, setWeapon] = useState<Weapon>({
        id: '', 
        granblue_id: 0, 
        name: { 
            en: '', 
            jp: ''
        }
    })
    
    function receiveData(data: Weapon) {
        setWeapon(data)
        closeModal()
    }

    return (
        <div>
            <div className="WeaponGridMainhand" onClick={openModal}>
                <img className="grid_image" src={mainhandImages[weapon.granblue_id]} />
                <span className='icon'><Plus /></span>
            </div>
            {open ? (
                <SearchModal 
                    close={closeModal}
                    send={receiveData}
                    placeholderText="Search for a weapon..."
                />
            ) : null}
        </div>
    )
}

export default WeaponGridUnit