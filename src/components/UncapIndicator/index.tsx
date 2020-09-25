import React from 'react'
import classnames from 'classnames'
import UncapStar from '~components/UncapStar'

import './index.css'


interface Props {
    uncapLevel: number
    flb: boolean
    ulb: boolean
}

const UncapIndicator = (props: Props) => {
    let numStars
    if (props.ulb) {
        numStars = 5
    } else if (props.flb) {
        numStars = 4
    } else {
        numStars = 3
    }

    return (
        <ul className="UncapIndicator">
            {
                Array.from(Array(numStars)).map((x, i) => {
                    if (i > 2) {
                        return <UncapStar uncap={true} key={`star_${i}`} />
                    } else {
                        return <UncapStar uncap={false} key={`star_${i}`} />
                    }
                })
            }
        </ul>
    )
}

export default UncapIndicator