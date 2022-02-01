import React, { useEffect, useState } from 'react'

import classnames from 'classnames'

import UncapIndicator from '~components/UncapIndicator'

import PlusIcon from '~public/icons/plus.svg'

import './index.scss'

interface Props {
    onClick: () => void
    updateUncap: (id: string, uncap: number) => void
    gridWeapon: GridWeapon | undefined
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
        'filled': (props.gridWeapon !== undefined)
    })

    const weapon = props.gridWeapon?.weapon

    useEffect(() => {
        generateImageUrl()
    })

    function generateImageUrl() {
        let imgSrc = ""
        if (props.gridWeapon) {
            const weapon = props.gridWeapon.weapon!
    
            if (props.unitType == 0)
                imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${weapon.granblue_id}.jpg`
            else
                imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`
        }
        
        setImageUrl(imgSrc)
    }

    function passUncapData(uncap: number) {
        if (props.gridWeapon)
            props.updateUncap(props.gridWeapon.id, uncap)
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
                    uncapLevel={props.gridWeapon?.uncap_level!}
                    updateUncap={passUncapData}
                />
            </div>
        </div>
    )
}

export default WeaponUnit
