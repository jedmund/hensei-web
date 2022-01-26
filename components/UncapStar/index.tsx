import React from 'react'
import classnames from 'classnames'

import './index.scss'

interface Props {
    uncap: boolean
}

const UncapStar = (props: Props) => {
    const classes = classnames({
        UncapStar: true,
        'uncap': props.uncap
    })

    return (
        <li className={classes}><img src="/icons/star.svg" /></li>
    )
}

export default UncapStar