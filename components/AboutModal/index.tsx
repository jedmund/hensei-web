import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

const AboutModal = () => {
    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <li className="MenuItem">About</li>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Content className="About Dialog" onOpenAutoFocus={ (event) => event.preventDefault() }>
                    <div className="DialogHeader">
                        <Dialog.Title className="DialogTitle">About</Dialog.Title>
                        <Dialog.Close className="DialogClose" asChild>
                            <span>
                                <CrossIcon />
                            </span>
                        </Dialog.Close>
                    </div>
                    <Dialog.Description className="DialogDescription">
                        <p>Granblue.team is a tool to save and share team compositions for <a href="https://game.granbluefantasy.jp">Granblue Fantasy.</a></p>
                        <p>Start adding things to a team and a URL will be created for you to share it wherever you like, no account needed.</p>
                        <p>You can make an account to save any teams you find for future reference, or to keep all of your teams together in one place.</p>
                    </Dialog.Description>
                    <Dialog.Title className="DialogTitle">Credits</Dialog.Title>
                    <Dialog.Description className="DialogDescription">
                        <p>Granblue.team was built by <a href="https://twitter.com/jedmund">@jedmund</a> with a lot of help from <a href="https://twitter.com/lalalalinna">@lalalalinna</a> and <a href="https://twitter.com/tarngerine">@tarngerine</a>.</p>
                    </Dialog.Description>
                    <Dialog.Title className="DialogTitle">Open Source</Dialog.Title>
                    <Dialog.Description className="DialogDescription">
                        <p>This app is open source. You can contribute on Github.</p>
                    </Dialog.Description>
                </Dialog.Content>
                <Dialog.Overlay className="Overlay" />
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default AboutModal