import React, { useEffect } from 'react'
import SearchModal from 'components/SearchModal/SearchModal'
import { useModal as useModal } from 'useModal'

import mainhandImages from 'images/mainhand/*.jpg'
import Plus from '../../../assets/plus.svg'

import './WeaponGridMainhand.css'

function WeaponGridMainhand(props: WeaponGridProps) {
    const { open, openModal, closeModal } = useModal()

    useEffect(() => {
        console.log('Mainhand weapon prop was updated.')
    }, [props.weapon])
    
    return (
        <div>
            <div className="WeaponGridMainhand" onClick={openModal}>
                <img className="grid_image" src={mainhandImages[props.weapon?.granblue_id]} />
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
        </div>
    )
}

export default WeaponGridMainhand
