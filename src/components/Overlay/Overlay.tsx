import React from 'react'
import './Overlay.css'

interface Props {
    onClick: OnClickEvent
}

const Overlay = (props: Props) => (
    <div className="Overlay" onClick={props.onClick} />
)

export default Overlay