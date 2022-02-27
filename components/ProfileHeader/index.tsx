import React, { useState } from 'react'
import { useSnapshot } from 'valtio'

import { appState } from '~utils/appState'

import './index.scss'

// Props
interface Props {
    username: string
    gender: boolean
}

const ProfileHeader = (props: Props) => {
    return (
        <section id="ProfileHeader">
            <h1>{props.username}</h1>
            <img 
                alt="Gran"
                className="gran"
                srcSet="/profile/gran.png,
                        /profile/gran@2x.png 2x"
                src="/profile/gran.png" />
        </section>
    )
}

export default ProfileHeader