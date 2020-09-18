import React, { useEffect } from 'react'
import classnames from 'classnames'
import SearchModal from '~components/SearchModal/SearchModal'
import { useModal as useModal } from '~utils/useModal'

import mainhandImages from '../../images/mainhand/*.jpg'
import Plus from '../../../assets/plus.svg'

import './WeaponGridMainhand.css'

function WeaponGridMainhand(props: WeaponGridProps) {
    const { open, openModal, closeModal } = useModal()

    useEffect(() => {
        console.log('Mainhand weapon prop was updated.')
    }, [props.weapon])
    
    let imgSrc
    if (props.weapon) {
        const weapon = props.weapon!
        imgSrc = mainhandImages[weapon.granblue_id]
    }

    const openModalIfEditable = (props.editable) ? openModal : () => {}

    const classes = classnames({
        WeaponGridMainhand: true,
        'editable': props.editable
    })

    return (
        <div>
            <div className={classes} onClick={openModalIfEditable}>
                <img className="grid_image" src={imgSrc} />
                { (props.editable) ? <span className='icon'><Plus /></span> : '' }
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
