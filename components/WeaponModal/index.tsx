import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'

import ElementToggle from '~components/ElementToggle'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

interface Props {
    gridWeapon: GridWeapon
    children: React.ReactNode
}

const WeaponModal = (props: Props) => {
    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                { props.children }
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Content className="Weapon Dialog" onOpenAutoFocus={ (event) => event.preventDefault() }>
                    <div className="DialogHeader">
                        <div className="DialogTop">
                            <Dialog.Title className="SubTitle">Modify Weapon</Dialog.Title>
                            <Dialog.Title className="DialogTitle">{props.gridWeapon.object.name.en}</Dialog.Title>
                        </div>
                        <Dialog.Close className="DialogClose" asChild>
                            <span>
                                <CrossIcon />
                            </span>
                        </Dialog.Close>
                    </div>

                    <section>
                        { (props.gridWeapon.object.element == 0) ? 
                            <ElementToggle 
                                currentElement={props.gridWeapon.object.element} /> 
                                : ''}
                    </section>
                </Dialog.Content>
                <Dialog.Overlay className="Overlay" />
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default WeaponModal