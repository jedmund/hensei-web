
import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

import { formatTimeAgo } from '~utils/timeAgo'

import './index.scss'

interface Props {
    shortcode: string
    name: string
    raid: Raid
    grid: GridWeapon[]
    updatedAt: Date
    onClick: (shortcode: string) => void
}

const GridRep = (props: Props) => {
    const numWeapons: number = 9

    const [mainhand, setMainhand] = useState<Weapon>()
    const [weapons, setWeapons] = useState<GridArray<Weapon>>({})

    const titleClass = classNames({
        'empty': !props.name
    })

    const raidClass = classNames({
        'raid': true,
        'empty': !props.raid
    })

    useEffect(() => {
        const newWeapons = Array(numWeapons)

        for (const [key, value] of Object.entries(props.grid)) {
            if (value.position == -1)
                setMainhand(value.object)
            else if (!value.mainhand && value.position != null)
                newWeapons[value.position] = value.object
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
            <div className="Details">
                <h2 className={titleClass}>{ (props.name) ? props.name : 'Untitled' }</h2>
                <div className="bottom">
                    <div className={raidClass}>{ (props.raid) ? props.raid.name.en : 'No raid set' }</div>
                    <time className="last-updated" dateTime={props.updatedAt.toISOString()}>{formatTimeAgo(props.updatedAt, 'en-us')}</time>
                </div>
            </div>

            <div className="Grid">
                <div className="weapon grid_mainhand">
                    {generateMainhandImage()}
                </div>

                <ul className="grid_weapons">
                    {
                        Array.from(Array(numWeapons)).map((x, i) => {
                            return (
                                <li key={`${props.shortcode}-${i}`} className="weapon grid_weapon">
                                    {generateGridImage(i)}
                                </li>
                            )
                        })
                    }
                </ul>
            </div>
        </div>
    )
}

export default GridRep
