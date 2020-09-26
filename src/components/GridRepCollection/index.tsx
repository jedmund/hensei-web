import React from 'react'

import './index.css'

interface Props {}

const GridRepCollection: React.FC<Props> = ({ children }) => {
    return (
        <ul className="GridRepCollection">
            {children}
        </ul>
    )
}

export default GridRepCollection
