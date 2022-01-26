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

    const [uncap, setUncap] = useState(props.uncapLevel)

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

    function toggleStar(index: number, empty: boolean) {
        if (empty)
            setUncap(index + 1)
        else
            setUncap(index)
    }

    return (
        <ul className="UncapIndicator">
            {
                Array.from(Array(numStars)).map((x, i) => {
                    if (props.type === 'character' && i > 4) {
                        return <UncapStar ulb={true} empty={i >= uncap} key={`star_${i}`} index={i} onClick={toggleStar} />
                    } else if (
                        props.type === 'character' && i == 4 ||
                        props.type !== 'character' && i > 2) {
                        return <UncapStar flb={true} empty={i >= uncap} key={`star_${i}`} index={i} onClick={toggleStar} />
                    } else {
                        return <UncapStar empty={i >= uncap} key={`star_${i}`} index={i} onClick={toggleStar} />
                    }
                })
            }
        </ul>
    )
}

export default UncapIndicator