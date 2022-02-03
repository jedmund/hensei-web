import React, { useEffect, useState } from 'react'
import classnames from 'classnames'

import UncapIndicator from '~components/UncapIndicator'
import PlusIcon from '~public/icons/plus.svg'

import './index.scss'

interface Props {
    gridWeapon: GridWeapon | undefined
    unitType: 0 | 1
    position: number
    editable: boolean
    onClick: () => void
    updateUncap: (id: string, position: number, uncap: number) => void
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

    const gridWeapon = props.gridWeapon
    const weapon = gridWeapon?.weapon

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
            props.updateUncap(props.gridWeapon.id, props.position, uncap)
    }

    return (
        <div>
            <div className={classes}>
                <div className="WeaponImage" onClick={ (props.editable) ? props.onClick : () => {} }>
                    <img alt={weapon?.name.en} className="grid_image" src={imageUrl} />
                    { (props.editable) ? <span className='icon'><PlusIcon /></span> : '' }
                </div>
                <h3 className="WeaponName">{weapon?.name.en}</h3>
                { (gridWeapon) ? 
                    <UncapIndicator 
                        type="weapon"
                        ulb={gridWeapon.weapon.uncap.ulb || false} 
                        flb={gridWeapon.weapon.uncap.flb || false}
                        uncapLevel={gridWeapon.uncap_level}
                        updateUncap={passUncapData}
                        special={false}
                    /> : ''
                }
            </div>
        </div>
    )
}

export default WeaponUnit
