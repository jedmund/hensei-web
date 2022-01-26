import React from 'react'
import classnames from 'classnames'

import './index.scss'

interface Props {
    special: boolean
    flb: boolean
    ulb: boolean
}

const UncapStar = (props: Props) => {
    const classes = classnames({
        UncapStar:  true,
        'special':  props.special,
        'mlb':      !props.special,
        'flb':      props.flb,
        'ulb':      props.ulb

    })

    return (
        <li className={classes}><img alt="" src="/icons/star.svg" /></li>
    )
}

UncapStar.defaultProps = {
    special: false,
    flb: false,
    ulb: false
}

export default UncapStar