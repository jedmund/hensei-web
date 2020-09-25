import React from 'react'
import classnames from 'classnames'

import './index.css'

import Star from '../../../assets/star'

interface Props {
    uncap: boolean
}

const UncapStar = (props: Props) => {
    const classes = classnames({
        UncapStar: true,
        'uncap': props.uncap
    })

    return (
        <li className={classes}><Star /></li>
    )
}

export default UncapStar