import React from 'react'
import './WeaponGridMainhand.css'

import SearchModal from '../SearchModal/SearchModal'
import { useModal as useModal } from '../../useModal'

import Plus from '../../../assets/plus.svg'

function WeaponGridUnit() {
    const { open, openModal, closeModal } = useModal()

    return (
        <div>
            <div className="WeaponGridMainhand" onClick={openModal}>
                <span className='icon'><Plus /></span>
            </div>
            {open ? (
                <SearchModal 
                    close={closeModal}
                    placeholderText="Search for a weapon..."
                />
            ) : null}
        </div>
    )
}

export default WeaponGridUnit