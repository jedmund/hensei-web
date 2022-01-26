import React, { useState } from 'react'
import UncapStar from '~components/UncapStar'

import './index.scss'


interface Props {
    type: 'character' | 'weapon' | 'summon'
    rarity?: number
    uncapLevel: number
    flb: boolean
    ulb?: boolean
}

const UncapIndicator = (props: Props) => {
    let numStars

    if (props.type === 'character') {
        if (props.flb) {
            numStars = 5
        } else {
            numStars = 4
        }
    } else {
        if (props.ulb) {
            numStars = 5
        } else if (props.flb) {
            numStars = 4
        } else {
            numStars = 3
        }
    }

    return (
        <ul className="UncapIndicator">
            {
                Array.from(Array(numStars)).map((x, i) => {
                    if (props.type === 'character' && i > 4) {
                        return <UncapStar ulb={true} key={`star_${i}`} />
                    } else if (
                        props.type === 'character' && i == 4 ||
                        props.type !== 'character' && i > 2) {
                        return <UncapStar flb={true} key={`star_${i}`} />
                    } else {
                        return <UncapStar key={`star_${i}`} />
                    }
                })
            }
        </ul>
    )
}

export default UncapIndicator