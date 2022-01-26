import React, { useEffect, useState } from 'react'

import classnames from 'classnames'

import UncapIndicator from '~components/UncapIndicator'

import PlusIcon from '~public/icons/plus.svg'

import './index.scss'

interface Props {
    onClick: () => void
    weapon: Weapon | undefined
    position: number
    editable: boolean
    unitType: 0 | 1
}

const WeaponUnit = (props: Props) => {
    const [imageUrl, setImageUrl] = useState('')

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
        let imgSrc = ""
        if (props.weapon) {
            const weapon = props.weapon!
    
            if (props.unitType == 0)
                imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${weapon.granblue_id}.jpg`
            else
                imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`
        }
        
        setImageUrl(imgSrc)
    }

    return (
        <div>
            <div className={classes}>
                <div className="WeaponImage" onClick={ (props.editable) ? props.onClick : () => {} }>
                    <img alt={weapon?.name.en} className="grid_image" src={imageUrl} />
                    { (props.editable) ? <span className='icon'><PlusIcon /></span> : '' }
                </div>
                <h3 className="WeaponName">{weapon?.name.en}</h3>
                <UncapIndicator 
                    type="weapon"
                    ulb={weapon?.uncap.ulb || false} 
                    flb={weapon?.uncap.flb || false}
                    uncapLevel={3}
                />
            </div>
        </div>
    )
}

export default WeaponUnit
