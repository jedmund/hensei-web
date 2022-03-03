import React, { useEffect, useState } from 'react'
import classnames from 'classnames'

import SearchModal from '~components/SearchModal'
import WeaponModal from '~components/WeaponModal'
import UncapIndicator from '~components/UncapIndicator'
import Button from '~components/Button'

import { ButtonType } from '~utils/enums'

import PlusIcon from '~public/icons/Add.svg'
import './index.scss'

interface Props {
    gridWeapon: GridWeapon | undefined
    unitType: 0 | 1
    position: number
    editable: boolean
    updateObject: (object: Character | Weapon | Summon, position: number) => void
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
    const weapon = gridWeapon?.object

    useEffect(() => {
        generateImageUrl()
    })

    function generateImageUrl() {
        let imgSrc = ""
        if (props.gridWeapon) {
            const weapon = props.gridWeapon.object!
    
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

    function canBeModified(gridWeapon: GridWeapon) {
        const weapon = gridWeapon.object

        return weapon.ax > 0 || 
            (weapon.series) && [2, 3, 8, 22, 25].includes(weapon.series)
    }

    const image = (
        <div className="WeaponImage">
            <img alt={weapon?.name.en} className="grid_image" src={imageUrl} />
            { (props.editable) ? <span className='icon'><PlusIcon /></span> : '' }
        </div>
    )

    const editableImage = (
        <div className="WeaponImage">
            <SearchModal 
                placeholderText="Search for a weapon..." 
                fromPosition={props.position} 
                object="weapons"
                send={props.updateObject}>
                    {image}
            </SearchModal>
        </div>
    )

    return (
        <div>
            <div className={classes}>
                { (props.editable && gridWeapon && canBeModified(gridWeapon)) ? 
                    <WeaponModal gridWeapon={gridWeapon}>
                        <div>
                            <Button icon="settings" type={ButtonType.IconOnly}/> 
                        </div>
                    </WeaponModal>: '' }
                { (props.editable) ? editableImage : image }
                { (gridWeapon) ? 
                    <UncapIndicator 
                        type="weapon"
                        ulb={gridWeapon.object.uncap.ulb || false} 
                        flb={gridWeapon.object.uncap.flb || false}
                        uncapLevel={gridWeapon.uncap_level}
                        updateUncap={passUncapData}
                        special={false}
                    /> : ''
                }
                <h3 className="WeaponName">{weapon?.name.en}</h3>
            </div>
        </div>
    )
}

export default WeaponUnit
