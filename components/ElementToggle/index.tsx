import React from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'

import './index.scss'

interface Props {
    currentElement: number
    sendValue: (value: string) => void
}

const ElementToggle = (props: Props) => {
    return (
        <ToggleGroup.Root className="ToggleGroup" type="single" defaultValue={`${props.currentElement}`} aria-label="Element" onValueChange={props.sendValue}>
            <ToggleGroup.Item className="ToggleItem" value="0" aria-label="null">
                Null
            </ToggleGroup.Item>
            <ToggleGroup.Item className="ToggleItem wind" value="1" aria-label="wind">
                Wind
            </ToggleGroup.Item>
            <ToggleGroup.Item className="ToggleItem fire" value="2" aria-label="fire">
                Fire
            </ToggleGroup.Item>
            <ToggleGroup.Item className="ToggleItem water" value="3" aria-label="water">
                Water
            </ToggleGroup.Item>
            <ToggleGroup.Item className="ToggleItem earth" value="4" aria-label="earth">
                Earth
            </ToggleGroup.Item>
            <ToggleGroup.Item className="ToggleItem dark" value="5" aria-label="dark">
                Dark
            </ToggleGroup.Item>
            <ToggleGroup.Item className="ToggleItem light" value="6" aria-label="light">
                Light
            </ToggleGroup.Item>
        </ToggleGroup.Root>
    )
}

export default ElementToggle