import React, { useContext } from 'react'
import './index.scss'

import PartyContext from '~context/PartyContext'

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
    selectedTab: GridType
    onClick: (event: React.ChangeEvent<HTMLInputElement>) => void
    onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const PartySegmentedControl = (props: Props) => {
    const { editable, element, hasExtra } = useContext(PartyContext)

    function getElement() {
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
                editable={editable}
                checked={hasExtra}
                onChange={props.onCheckboxChange} 
            />
        </div>

    return (
        <div className="PartyNavigation">
            <SegmentedControl elementClass={getElement()}>
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
                    if (editable && props.selectedTab == GridType.Weapon) {
                        return extraToggle
                    }
                })()
            }
        </div>
    )
}

export default PartySegmentedControl
