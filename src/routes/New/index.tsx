import React, { useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import WeaponGrid from '~components/WeaponGrid'
import SegmentedControl from '~components/SegmentedControl'
import Segment from '~components/Segment'
import PartySegmentedControl from '~components/PartySegmentedControl'
import SummonGrid from '~components/SummonGrid'
import CharacterGrid from '~components/CharacterGrid'

interface Props {}
interface NewProps extends RouteComponentProps<Props> {}

const New: React.FC<NewProps> = (props: NewProps) => {
    const [cookies, setCookie] = useCookies(['user'])
    const [selectedTab, setSelectedTab] = useState('weapons')
    const [grid, setGrid] = useState<JSX.Element>(
        <WeaponGrid 
            userId={cookies.user ? cookies.user.user_id : ''} 
            editable={true} 
            exists={false} 
            pushHistory={callback} 
        />
    )

    function callback(path: string) {
        // This is scuffed, how do we do this natively?
        window.history.replaceState(null, `Grid Tool`, `${path}`)
    }

    function segmentClicked(event: React.ChangeEvent<HTMLInputElement>) {
        setSelectedTab(event.target.value)

        switch(event.target.value) {
            case 'weapons':
                setGrid((
                    <WeaponGrid 
                        userId={cookies.user ? cookies.user.user_id : ''} 
                        editable={true} 
                        exists={false} 
                        pushHistory={callback} 
                    />
                ))
                break
            case 'summons':
                setGrid((
                    <SummonGrid 
                        editable={true} 
                    />
                ))
                break
            case 'characters':
                setGrid((
                    <CharacterGrid
                        editable={true}
                    />
                ))
                break
            default: 
                break
        }
    }

    return (
        <div id="Content">
            <PartySegmentedControl
                selectedTab={selectedTab}
                onClick={segmentClicked}
            />
            
            {grid}
        </div>
    )
}

export default New