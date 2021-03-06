import React from 'react'

import './index.css'

interface Props {}

const GridRepCollection: React.FC<Props> = ({ children }) => {
    return (
        <div className="GridRepCollection">
            {children}
        </div>
    )
}

export default GridRepCollection
