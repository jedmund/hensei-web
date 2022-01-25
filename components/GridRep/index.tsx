import React, { useEffect, useState } from 'react'
import Image from 'next/image'

import './index.scss'

import mainhandImages from '../../images/weapon-main/*.jpg'
import gridImages from '../../images/weapon-grid/*.jpg'

interface Props {
    shortcode: string
    grid: GridWeapon[]
    onClick: (shortcode: string) => void
}

const GridRep = (props: Props) => {
    const numWeapons: number = 9

    const [mainhand, setMainhand] = useState<Weapon>()
    const [weapons, setWeapons] = useState<GridArray<Weapon>>({})

    useEffect(() => {
        configure()
    }, [])
    
    function configure() {
        const newWeapons = Array(numWeapons)

        for (const [key, value] of Object.entries(props.grid)) {
            if (value.position == -1)
                setMainhand(value.weapon)
            else if (!value.mainhand && value.position != null)
                newWeapons[value.position] = value.weapon
        }

        setWeapons(newWeapons)
    }

    function navigate() {
        props.onClick(props.shortcode)
    }

    function generateMainhandImage() {
        return <img alt={mainhand?.name.en} src={`/images/weapon-main/${mainhand?.granblue_id}.jpg`} />
    }

    function generateGridImage(position: number) {
        return <img alt={weapons[position]?.name.en} src={`/images/weapon-grid/${weapons[position]?.granblue_id}.jpg`} />
    }

    return (
        <div className="GridRep" onClick={navigate}>
            <div className="weapon grid_mainhand">
                {generateMainhandImage()}
            </div>

            <ul className="grid_weapons">
                {
                    Array.from(Array(numWeapons)).map((x, i) => {
                        return (
                            <li key={`${props.shortcode}-${i}`} className="grid_weapon">
                                {generateGridImage(i)}
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )
}

export default GridRep
