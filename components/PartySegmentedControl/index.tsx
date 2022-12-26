import React from 'react'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

import { appState } from '~utils/appState'

import SegmentedControl from '~components/SegmentedControl'
import Segment from '~components/Segment'
import ToggleSwitch from '~components/ToggleSwitch'

import { GridType } from '~utils/enums'

import './index.scss'

interface Props {
  selectedTab: GridType
  onClick: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const PartySegmentedControl = (props: Props) => {
  const { t } = useTranslation('common')

  const { party, grid } = useSnapshot(appState)

  function getElement() {
    let element: number = 0
    if (party.element == 0 && grid.weapons.mainWeapon)
      element = grid.weapons.mainWeapon.element
    else element = party.element

    switch (element) {
      case 1:
        return 'wind'
        break
      case 2:
        return 'fire'
        break
      case 3:
        return 'water'
        break
      case 4:
        return 'earth'
        break
      case 5:
        return 'dark'
        break
      case 6:
        return 'light'
        break
    }
  }

  const extraToggle = (
    <div className="ExtraSwitch">
      <span className="Text">Extra</span>
      <ToggleSwitch
        name="ExtraSwitch"
        editable={party.editable}
        checked={party.extra}
        onChange={props.onCheckboxChange}
      />
    </div>
  )

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
        >
          {t('party.segmented_control.characters')}
        </Segment>

        <Segment
          groupName="grid"
          name="weapons"
          selected={props.selectedTab == GridType.Weapon}
          onClick={props.onClick}
        >
          {t('party.segmented_control.weapons')}
        </Segment>

        <Segment
          groupName="grid"
          name="summons"
          selected={props.selectedTab == GridType.Summon}
          onClick={props.onClick}
        >
          {t('party.segmented_control.summons')}
        </Segment>
      </SegmentedControl>

      {(() => {
        if (party.editable && props.selectedTab == GridType.Weapon) {
          return extraToggle
        }
      })()}
    </div>
  )
}

export default PartySegmentedControl
