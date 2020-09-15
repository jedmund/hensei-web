import React from 'react'
import './WeaponGrid.css'

import WeaponGridMainhand from '../WeaponGridMainhand/WeaponGridMainhand'
import WeaponGridUnit from '../WeaponGridUnit/WeaponGridUnit'

class WeaponGrid extends React.Component {
    render() {
        const numWeapons = 9
        let weapons = []

        Array.from(Array(numWeapons)).forEach((x, i) => {
            weapons.push(<WeaponGridUnit key={`grid_unit_${i}`} />)
        })

        return (
            <div className="WeaponGrid">
                <WeaponGridMainhand key="grid_mainhand" />

                <div className="grid-weapons">
                    {weapons}
                </div>
            </div>
        )
    }
}

export default WeaponGrid