import React from 'react'
import './Overlay.css'

const Overlay = (onClick: OnClickEvent) => (
    <div className="Overlay" onClick={onClick} />
)

export default Overlay