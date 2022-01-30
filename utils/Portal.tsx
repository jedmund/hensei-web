import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const modalRoot = document.querySelector('#modal') as HTMLElement

const Portal: React.FC<{}> = ({ children }) => {    
    const modalContent = document.createElement('div')
    modalContent.classList.add('modal_content')

    const el = useRef(modalContent)

    useEffect(() => {
        const current = el.current

        modalRoot!.appendChild(current)
        return () => void modalRoot!.removeChild(current)
    }, [])

    return createPortal(children, el.current)
}

export default Portal
