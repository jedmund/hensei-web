import React, { useEffect, useState } from 'react'

import './index.css'

import mainhandImages from '../../images/mainhand/*.jpg'
import gridImages from '../../images/grid/*.jpg'

interface Props {
    shortcode: string
    grid: GridWeapon[]
    onClick: (shortcode: string) => void
}

const GridRep = (props: Props) => {
    const numWeapons: number = 9

    const [mainhand, setMainhand] = useState<Weapon>()
    const [weapons, setWeapons] = useState<GridArray>({})

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

    return (
        <div className="GridRep" onClick={navigate}>
            <div className="weapon grid_mainhand">
                <img src={
                    process.env.NODE_ENV === 'development'
                        ? mainhandImages[mainhand?.granblue_id || 0]
                        : `${process.env.SIERO_IMG_URL}/mainhand/${mainhand?.granblue_id}.jpg`
                } />
            </div>

            <ul className="grid_weapons">
                {
                    Array.from(Array(numWeapons)).map((x, i) => {
                        console.log()
                        return (
                            <li className="weapon grid_weapon" key={`grid_unit_${i}`}>
                                <img src={
                                    process.env.NODE_ENV === 'development'
                                        ? gridImages[weapons[i]?.granblue_id || 0]
                                        : `${process.env.SIERO_IMG_URL}/grid/${weapons[i]?.granblue_id}.jpg`
                                } />
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )
}

export default GridRep
