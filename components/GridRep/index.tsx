import React, { useEffect, useState } from 'react'

import './index.scss'

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
        const newWeapons = Array(numWeapons)

        for (const [key, value] of Object.entries(props.grid)) {
            if (value.position == -1)
                setMainhand(value.weapon)
            else if (!value.mainhand && value.position != null)
                newWeapons[value.position] = value.weapon
        }

        setWeapons(newWeapons)
    }, [props.grid])

    function navigate() {
        props.onClick(props.shortcode)
    }

    function generateMainhandImage() {
        return (mainhand) ?
            <img alt={mainhand?.name.en} src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${mainhand?.granblue_id}.jpg`} /> : ''
    }

    function generateGridImage(position: number) {
        return (weapons[position]) ?
            <img alt={weapons[position]?.name.en} src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapons[position]?.granblue_id}.jpg`} /> : ''
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
