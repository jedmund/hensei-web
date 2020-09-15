import { useEffect, useRef, useState } from 'react'
import { createPortal, render } from 'react-dom'

const Portal = ({ children }) => {
    const el = document.createElement('div')
    el.classList.add('modal_content')

    let modalRoot = document.getElementById('modal')

    if (!modalRoot) {
        modalRoot = document.createElement('div')
        modalRoot.setAttribute('id', 'modal')
        document.body.appendChild(modalRoot)
    }

    const [val, setVal] = useState(true)

    const modalDiv = useRef(null)

    useEffect(() => {
        if (!modalDiv.current) {
            modalDiv.current = el
            setVal(!val)
        }
    }, [modalDiv])

    useEffect(() => {
        modalRoot.appendChild(modalDiv.current)
        return () => {
            return modalRoot.removeChild(modalDiv.current)
        }
    }, [modalDiv, modalRoot])

    if (modalDiv.current) {
        return createPortal(children, modalDiv.current)
    }

    return null
}

export default Portal
