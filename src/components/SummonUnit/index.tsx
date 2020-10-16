import React, { useState } from 'react'
import classnames from 'classnames'
import UncapIndicator from '~components/UncapIndicator'

import './index.css'

import Plus from '../../../assets/plus.svg'

interface Props {
    onReceiveData: (summon: Summon, position: number) => void
    summon: Summon | undefined
    position: number
    editable: boolean
    unitType: 0 | 1 | 2
}

const SummonUnit = (props: Props) => {
    const numSummons: number = 4
    const openModal = () => {}

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

    return (
        <div>
            <div className={classes} onClick={openModalIfEditable}>
                <div className="SummonImage">
                    { (props.editable) ? <span className='icon'><Plus /></span> : '' }
                </div>
                <UncapIndicator 
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
