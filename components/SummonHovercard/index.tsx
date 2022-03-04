import React from 'react'
import * as HoverCard from '@radix-ui/react-hover-card'

import WeaponLabelIcon from '~components/WeaponLabelIcon'
import UncapIndicator from '~components/UncapIndicator'

import { axData } from '~utils/axData'

import './index.scss'

interface Props {
    gridSummon: GridSummon
    children: React.ReactNode
}

interface KeyNames {
    [key: string]: {
        en: string,
        jp: string
    }
}

const SummonHovercard = (props: Props) => {
    const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']
    const Proficiency = ['none', 'sword', 'dagger', 'axe', 'spear', 'bow', 'staff', 'fist', 'harp', 'gun', 'katana']

    const tintElement = Element[props.gridSummon.object.element]
    const wikiUrl = `https://gbf.wiki/${props.gridSummon.object.name.en.replaceAll(' ', '_')}`

    function summonImage() {
        let imgSrc = ""

        if (props.gridSummon) {
            const summon = props.gridSummon.object

            const upgradedSummons = [
                '2040094000', '2040100000', '2040080000', '2040098000', 
                '2040090000', '2040084000', '2040003000', '2040056000'
            ]
            
            let suffix = ''
            if (upgradedSummons.indexOf(summon.granblue_id.toString()) != -1 && props.gridSummon.uncap_level == 5)
                suffix = '_02'
    
            // Generate the correct source for the summon
            imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblue_id}${suffix}.jpg`
        }

        return imgSrc
    }

    return (
        <HoverCard.Root>
            <HoverCard.Trigger>
                { props.children }
            </HoverCard.Trigger>
            <HoverCard.Content className="Weapon Hovercard">
                <div className="top">
                    <div className="title">
                        <h4>{ props.gridSummon.object.name.en }</h4>
                        <img alt={props.gridSummon.object.name.en} src={summonImage()} />
                    </div>
                    <div className="subInfo">
                        <div className="icons">
                            <WeaponLabelIcon labelType={Element[props.gridSummon.object.element]}/>
                        </div>
                        <UncapIndicator 
                            type="summon"
                            ulb={props.gridSummon.object.uncap.ulb || false} 
                            flb={props.gridSummon.object.uncap.flb || false}
                            special={false}
                        />
                    </div>
                </div>
                <a className={`Button ${tintElement}`} href={wikiUrl} target="_new">View more on gbf.wiki</a>
                <HoverCard.Arrow />
            </HoverCard.Content>
        </HoverCard.Root>
    )
}

export default SummonHovercard

