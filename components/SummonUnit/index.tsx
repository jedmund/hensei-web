import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import classnames from 'classnames'

import SearchModal from '~components/SearchModal'
import SummonHovercard from '~components/SummonHovercard'
import UncapIndicator from '~components/UncapIndicator'
import PlusIcon from '~public/icons/Add.svg'

import './index.scss'

interface Props {
    gridSummon: GridSummon | undefined
    unitType: 0 | 1 | 2
    position: number
    editable: boolean
    updateObject: (object: Character | Weapon | Summon, position: number) => void
    updateUncap: (id: string, position: number, uncap: number) => void
}

const SummonUnit = (props: Props) => {
    const { t } = useTranslation('common')
    
    const [imageUrl, setImageUrl] = useState('')

    const router = useRouter()
    const locale = (router.locale && ['en', 'ja'].includes(router.locale)) ? router.locale : 'en'

    const classes = classnames({
        SummonUnit: true,
        'main': props.unitType == 0,
        'grid': props.unitType == 1,
        'friend': props.unitType == 2,
        'editable': props.editable,
        'filled': (props.gridSummon !== undefined)
    })

    const gridSummon = props.gridSummon
    const summon = gridSummon?.object

    useEffect(() => {
        generateImageUrl()
    })

    function generateImageUrl() {
        let imgSrc = ""
        if (props.gridSummon) {
            const summon = props.gridSummon.object!

            const upgradedSummons = [
                '2040094000', '2040100000', '2040080000', '2040098000', 
                '2040090000', '2040084000', '2040003000', '2040056000',
                '2040020000', '2040034000', '2040028000', '2040027000',
                '2040046000', '2040047000'
            ]
            
            let suffix = ''
            if (upgradedSummons.indexOf(summon.granblue_id.toString()) != -1 && props.gridSummon.uncap_level == 5)
                suffix = '_02'
    
            // Generate the correct source for the summon
            if (props.unitType == 0 || props.unitType == 2)
                imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-main/${summon.granblue_id}${suffix}.jpg`
            else
                imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblue_id}${suffix}.jpg`
        }
        
        setImageUrl(imgSrc)
    }

    function passUncapData(uncap: number) {
        if (props.gridSummon)
            props.updateUncap(props.gridSummon.id, props.position, uncap)
    }

    const image = (
        <div className="SummonImage">
            <img alt={summon?.name.en} className="grid_image" src={imageUrl} />
            { (props.editable) ? <span className='icon'><PlusIcon /></span> : '' }
        </div>
    )

    const editableImage = (
        <SearchModal 
            placeholderText={t('search.placeholders.summon')}
            fromPosition={props.position} 
            object="summons"
            send={props.updateObject}>
                {image}
        </SearchModal>
    )

    const unitContent = (
        <div className={classes}>
            { (props.editable) ? editableImage : image }
            { (gridSummon) ? 
                <UncapIndicator 
                    type="summon"
                    ulb={gridSummon.object.uncap.ulb || false}
                    flb={gridSummon.object.uncap.flb || false}
                    uncapLevel={gridSummon.uncap_level} 
                    updateUncap={passUncapData}
                    special={false}               
                /> : '' 
            }
            <h3 className="SummonName">{summon?.name[locale]}</h3>
        </div>
    )

    const withHovercard = (
        <SummonHovercard gridSummon={gridSummon!}>
            {unitContent}
        </SummonHovercard>
    )

    return (gridSummon) ? withHovercard : unitContent
}

export default SummonUnit
