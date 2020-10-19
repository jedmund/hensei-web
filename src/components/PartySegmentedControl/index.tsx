import React from 'react'
import SegmentedControl from '~components/SegmentedControl'
import Segment from '~components/Segment'

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
}

const PartySegmentedControl = (props: Props) => {
    return (
        <div>
            <SegmentedControl>
                {/* <Segment
                    groupName="grid"
                    name="class"
                    selected={props.selectedTab === GridType.Class}
                    onClick={props.onClick}
                >Class</Segment> */}

                <Segment 
                    groupName="grid"
                    name="characters"
                    selected={props.selectedTab === GridType.Character}
                    onClick={props.onClick}
                >Characters</Segment>

                <Segment 
                    groupName="grid"
                    name="weapons"
                    selected={props.selectedTab === GridType.Weapon}
                    onClick={props.onClick}
                >Weapons</Segment>

                <Segment 
                    groupName="grid"
                    name="summons"
                    selected={props.selectedTab === GridType.Summon}
                    onClick={props.onClick}
                >Summons</Segment>
            </SegmentedControl>
        </div>
    )
}

export default PartySegmentedControl
