import React, { useEffect, useState } from 'react'

import classnames from 'classnames'

import UncapIndicator from '~components/UncapIndicator'

import PlusIcon from '~public/icons/plus.svg'

import './index.scss'

interface Props {
    onClick: () => void
    summon: Summon | undefined
    position: number
    editable: boolean
    unitType: 0 | 1 | 2
}

const SummonUnit = (props: Props) => {
    const [imageUrl, setImageUrl] = useState('')

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
        let imgSrc = ""
        if (props.summon) {
            const summon = props.summon!
    
            // Generate the correct source for the summon
            if (props.unitType == 0 || props.unitType == 2)
                imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-main/${summon.granblue_id}.jpg`
            else
                imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblue_id}.jpg`
        }
        
        setImageUrl(imgSrc)
    }

    return (
        <div>
            <div className={classes}>
                <div className="SummonImage" onClick={ (props.editable) ? props.onClick : () => {} }>
                    <img alt={summon?.name.en} className="grid_image" src={imageUrl} />
                    { (props.editable) ? <span className='icon'><PlusIcon /></span> : '' }
                </div>
                <UncapIndicator 
                    type="summon"
                    ulb={summon?.uncap.ulb || false} 
                    flb={summon?.uncap.flb || false}
                    uncapLevel={3}
                />
                <h3 className="SummonName">{summon?.name.en}</h3>
            </div>
        </div>
    )
}

export default SummonUnit
