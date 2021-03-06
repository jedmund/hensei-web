import React from 'react'

import './index.scss'

interface Props {}

const SegmentedControl: React.FC<Props> = ({ children }) => {
    return (
        <div className="SegmentedControlWrapper">
            <div className="SegmentedControl">
                {children}
            </div>
        </div>
    )
}

export default SegmentedControl