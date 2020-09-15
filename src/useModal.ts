import { useState } from 'react'

export const useModal = () => {
    const [open, onOpenModal] = useState(false)
    const [close, onCloseModal] = useState(false)

    const openModal = () => {
        onOpenModal(true)
    }

    const closeModal = () => {
        onCloseModal(true)
        onOpenModal(false)
    }

    return { open, close, openModal, closeModal }
}
