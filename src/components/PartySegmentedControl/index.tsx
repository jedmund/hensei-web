import React from 'react'
import SegmentedControl from '~components/SegmentedControl'
import Segment from '~components/Segment'

interface Props {
    selectedTab: string
    onClick: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const PartySegmentedControl = (props: Props) => {
    return (
        <div>
            <SegmentedControl>
                <Segment
                    groupName="grid"
                    name="class"
                    selected={props.selectedTab === 'class'}
                    onClick={props.onClick}
                >Class</Segment>
                <Segment 
                    groupName="grid"
                    name="characters"
                    selected={props.selectedTab === 'characters'}
                    onClick={props.onClick}
                >Characters</Segment>

                <Segment 
                    groupName="grid"
                    name="weapons"
                    selected={props.selectedTab === 'weapons'}
                    onClick={props.onClick}
                >Weapons</Segment>

                <Segment 
                    groupName="grid"
                    name="summons"
                    selected={props.selectedTab === 'summons'}
                    onClick={props.onClick}
                >Summons</Segment>
            </SegmentedControl>
        </div>
    )
}

export default PartySegmentedControl
