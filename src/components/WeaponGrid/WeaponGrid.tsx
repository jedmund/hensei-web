import React from 'react'
import './WeaponGrid.css'

import WeaponGridMainhand from '../WeaponGridMainhand/WeaponGridMainhand'
import WeaponGridUnit from '../WeaponGridUnit/WeaponGridUnit'

const WeaponGrid = () => (
    <div className="WeaponGrid">
        <WeaponGridMainhand />

        <div className="grid-weapons">
            <WeaponGridUnit />
            <WeaponGridUnit />
            <WeaponGridUnit />
            <WeaponGridUnit />
            <WeaponGridUnit />
            <WeaponGridUnit />
            <WeaponGridUnit />
            <WeaponGridUnit />
            <WeaponGridUnit />
        </div>
    </div>
)

export default WeaponGrid