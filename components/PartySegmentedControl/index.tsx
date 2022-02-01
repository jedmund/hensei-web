import React from 'react'
import './index.scss'

import SegmentedControl from '~components/SegmentedControl'
import Segment from '~components/Segment'
import ToggleSwitch from '~components/ToggleSwitch'

// GridType
export enum GridType {
    Class,
    Character,
    Weapon,
    Summon
}

interface Props {
    editable: boolean
    extra: boolean
    selectedTab: GridType
    onClick: (event: React.ChangeEvent<HTMLInputElement>) => void
    onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const PartySegmentedControl = (props: Props) => {
    const extraToggle =
        <div className="Extra">
            Extra
            <ToggleSwitch 
                name="Extra" 
                editable={props.editable}
                checked={props.extra}
                onChange={props.onCheckboxChange} 
            />
        </div>

    return (
        <div className="PartyNavigation">
            <SegmentedControl>
                <Segment
                    groupName="grid"
                    name="class"
                    selected={props.selectedTab === GridType.Class}
                    onClick={props.onClick}
                >Class</Segment>

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
                    if (props.editable && props.selectedTab == GridType.Weapon) {
                        return extraToggle
                    }
                })()
            }
        </div>
    )
}

export default PartySegmentedControl
