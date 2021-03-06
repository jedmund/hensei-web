import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import { useModal as useModal } from '~utils/useModal'

import SearchModal from '~components/SearchModal'
import UncapIndicator from '~components/UncapIndicator'

import mainImages from '../../images/summon-main/*.jpg'
import gridImages from '../../images/summon-grid/*.jpg'
import Plus from '../../../assets/plus.svg'

import './index.scss'

interface Props {
    onReceiveData: (summon: Summon, position: number) => void
    summon: Summon | undefined
    position: number
    editable: boolean
    unitType: 0 | 1 | 2
}

const SummonUnit = (props: Props) => {
    const [imageUrl, setImageUrl] = useState('')
    const { open, openModal, closeModal } = useModal()

    const openModalIfEditable = (props.editable) ? openModal : () => {}

    const classes = classnames({
        SummonUnit: true,
        'main': props.unitType == 0,
        'grid': props.unitType == 1,
        'friend': props.unitType == 2,
        'editable': props.editable,
        'filled': (props.summon !== undefined)
    })

    const summon = props.summon

    useEffect(() => {
        generateImageUrl()
    })

    function generateImageUrl() {
        let imgSrc
        if (props.summon) {
            const summon = props.summon!
    
            // Generate the correct source for the weapon
            if (process.env.NODE_ENV === 'development') {
                if (props.unitType == 0 || props.unitType == 2)
                    imgSrc = mainImages[summon.granblue_id]
                else
                    imgSrc = gridImages[summon.granblue_id]
            } else if (process.env.NODE_ENV === 'production') {
                if (props.unitType == 0 || props.unitType == 2)
                    imgSrc = `${process.env.SIERO_IMG_URL}/summon-main/${summon.granblue_id}.jpg`
                else
                    imgSrc = `${process.env.SIERO_IMG_URL}/summon-grid/${summon.granblue_id}.jpg`
            }
        }
        
        setImageUrl(imgSrc)
    }

    function sendData(object: Character | Weapon | Summon, position: number) {
        if (isSummon(object)) {
            props.onReceiveData(object, position)
        }
    }

    function isSummon(object: Character | Weapon | Summon): object is Summon {
        // There aren't really any unique fields here
        return (object as Summon).granblue_id !== undefined
    }

    return (
        <div>
            <div className={classes} onClick={openModalIfEditable}>
                <div className="SummonImage">
                    { 
                        (imageUrl != '') 
                            ? <img className="grid_image" src={imageUrl} />
                            : <img className="grid_image" />

                    }
                    { (props.editable) ? <span className='icon'><Plus /></span> : '' }
                </div>
                <UncapIndicator 
                    type="summon"
                    ulb={summon?.uncap.ulb || false} 
                    flb={summon?.uncap.flb || false}
                    uncapLevel={3}
                />
                <h3 className="SummonName">{summon?.name.en}</h3>
            </div>
            {open ? (
                <SearchModal 
                    close={closeModal}
                    send={sendData}
                    fromPosition={props.position}
                    object="summons"
                    placeholderText="Search for a summon..."
                />
            ) : null}
        </div>
    )
}

export default SummonUnit
