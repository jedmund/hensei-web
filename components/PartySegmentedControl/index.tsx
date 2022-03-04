import React from 'react'
import './index.scss'

import { appState } from '~utils/appState'

import SegmentedControl from '~components/SegmentedControl'
import Segment from '~components/Segment'
import ToggleSwitch from '~components/ToggleSwitch'

import { GridType } from '~utils/enums'
import { useSnapshot } from 'valtio'

interface Props {
    selectedTab: GridType
    onClick: (event: React.ChangeEvent<HTMLInputElement>) => void
    onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const PartySegmentedControl = (props: Props) => {
    const { party, grid } = useSnapshot(appState)

    function getElement() {
        let element: number = 0
        if (party.element == 0 && grid.weapons.mainWeapon)
            element = grid.weapons.mainWeapon.element
        else
            element = party.element

        switch(element) {
            case 1: return "wind"; break
            case 2: return "fire"; break
            case 3: return "water"; break
            case 4: return "earth"; break
            case 5: return "dark"; break
            case 6: return "light"; break
        }
    }

    const extraToggle =
        <div className="ExtraSwitch">
            Extra
            <ToggleSwitch 
                name="ExtraSwitch" 
                editable={party.editable}
                checked={party.extra}
                onChange={props.onCheckboxChange} 
            />
        </div>

    return (
        <div className="PartyNavigation">
            <SegmentedControl elementClass={getElement()}>
                {/* <Segment
                    groupName="grid"
                    name="class"
                    selected={props.selectedTab === GridType.Class}
                    onClick={props.onClick}
                >Class</Segment> */}

                <Segment 
                    groupName="grid"
                    name="characters"
                    selected={props.selectedTab == GridType.Character}
                    onClick={props.onClick}
                >Characters</Segment>

                <Segment 
                    groupName="grid"
                    name="weapons"
                    selected={props.selectedTab == GridType.Weapon}
                    onClick={props.onClick}
                >Weapons</Segment>

                <Segment 
                    groupName="grid"
                    name="summons"
                    selected={props.selectedTab == GridType.Summon}
                    onClick={props.onClick}
                >Summons</Segment>
            </SegmentedControl>

            {
                (() => {
                    if (party.editable && props.selectedTab == GridType.Weapon) {
                        return extraToggle
                    }
                })()
            }
        </div>
    )
}

export default PartySegmentedControl
