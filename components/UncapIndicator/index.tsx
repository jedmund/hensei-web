import React, { useEffect, useRef, useState } from 'react'
import UncapStar from '~components/UncapStar'

import './index.scss'

interface Props {
    type: 'character' | 'weapon' | 'summon'
    rarity?: number
    uncapLevel: number
    flb: boolean
    ulb?: boolean
    updateUncap: (uncap: number) => void
}

const UncapIndicator = (props: Props) => {
    const [uncap, setUncap] = useState(props.uncapLevel)

    useEffect(() => {
        props.updateUncap(uncap)
    }, [uncap])

    const numStars = setNumStars()
    function setNumStars() {
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

        return numStars
    }

    function toggleStar(index: number, empty: boolean) {
        if (empty) setUncap(index + 1)
        else setUncap(index)
    }

    const transcendence = (i: number) => {
        return <UncapStar ulb={true} empty={i >= uncap} key={`star_${i}`} index={i} onClick={toggleStar} />
    }

    const flb = (i: number) => {
        return <UncapStar flb={true} empty={i >= uncap} key={`star_${i}`} index={i} onClick={toggleStar} />
    }

    const mlb = (i: number) => {
        return <UncapStar empty={i >= uncap} key={`star_${i}`} index={i} onClick={toggleStar} />
    }



    return (
        <ul className="UncapIndicator">
            {
                Array.from(Array(numStars)).map((x, i) => {
                    if (props.type === 'character' && i > 4) {
                        return transcendence(i)
                    } else if (
                        props.type === 'character' && i == 4 ||
                        props.type !== 'character' && i > 2) {
                        return flb(i)
                    } else {
                        return mlb(i)
                    }
                })
            }
        </ul>
    )
}

export default UncapIndicator