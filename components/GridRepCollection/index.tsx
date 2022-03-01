import classNames from 'classnames'
import React from 'react'

import './index.scss'

interface Props {
    loading: boolean
    children: React.ReactNode
}

const GridRepCollection = (props: Props) => {
    const classes = classNames({
        'GridRepCollection': true,
        'visible': !props.loading
    })
    
    return (
        <div className={classes}>
            {props.children}
        </div>
    )
}

export default GridRepCollection
