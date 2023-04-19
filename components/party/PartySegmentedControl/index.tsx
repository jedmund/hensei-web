import React from 'react'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

import { appState } from '~utils/appState'

import SegmentedControl from '~components/common/SegmentedControl'

import { GridType } from '~utils/enums'

import './index.scss'
import classNames from 'classnames'
import RepSegment from '~components/reps/RepSegment'
import CharacterRep from '~components/reps/CharacterRep'
import { accountState } from '~utils/accountState'
import WeaponRep from '~components/reps/WeaponRep'
import SummonRep from '~components/reps/SummonRep'

interface Props {
  selectedTab: GridType
  onClick: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const PartySegmentedControl = (props: Props) => {
  // Set up translations
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
      case 2:
        return 'fire'
      case 3:
        return 'water'
      case 4:
        return 'earth'
      case 5:
        return 'dark'
      case 6:
        return 'light'
    }
  }

  const characterSegment = () => {
    return (
      <RepSegment
        controlGroup="grid"
        inputName="characters"
        name={t('party.segmented_control.characters')}
        selected={props.selectedTab == GridType.Character}
        onClick={props.onClick}
      >
        <CharacterRep
          job={appState.party?.job}
          element={appState.party?.element}
          gender={
            accountState.account.user ? accountState.account.user.gender : 0
          }
          grid={appState.grid.characters}
        />
      </RepSegment>
    )
  }

  const weaponSegment = () => {
    {
      return (
        <RepSegment
          controlGroup="grid"
          inputName="weapons"
          name="Weapons"
          selected={props.selectedTab == GridType.Weapon}
          onClick={props.onClick}
        >
          <WeaponRep grid={appState.grid.weapons} />
        </RepSegment>
      )
    }
  }

  const summonSegment = () => {
    return (
      <RepSegment
        controlGroup="grid"
        inputName="summons"
        name="Summons"
        selected={props.selectedTab == GridType.Summon}
        onClick={props.onClick}
      >
        <SummonRep grid={appState.grid.summons} />
      </RepSegment>
    )
  }

  return (
    <div
      className={classNames({
        PartyNavigation: true,
        Editable: party.editable,
      })}
    >
      <SegmentedControl elementClass={getElement()}>
        {characterSegment()}
        {weaponSegment()}
        {summonSegment()}
      </SegmentedControl>
    </div>
  )
}

export default PartySegmentedControl
