import React from 'react'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import { appState } from '~utils/appState'
import { accountState } from '~utils/accountState'

import SegmentedControl from '~components/common/SegmentedControl'
import RepSegment from '~components/reps/RepSegment'
import CharacterRep from '~components/reps/CharacterRep'
import WeaponRep from '~components/reps/WeaponRep'
import SummonRep from '~components/reps/SummonRep'

import { GridType } from '~utils/enums'

import styles from './index.module.scss'

// Fix for valtio readonly array
declare module 'valtio' {
  function useSnapshot<T extends object>(p: T): T
}

interface Props {
  selectedTab: GridType
  onClick: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const PartySegmentedControl = (props: Props) => {
  // Set up translations
  const { t } = useTranslation('common')

  const { party, grid } = useSnapshot(appState)

  const getElement = () => {
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
        selected={props.selectedTab === GridType.Character}
        onClick={props.onClick}
      >
        <CharacterRep
          job={party.job}
          element={party.element}
          gender={
            accountState.account.user ? accountState.account.user.gender : 0
          }
          grid={grid.characters}
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
          name={t('party.segmented_control.weapons')}
          selected={props.selectedTab === GridType.Weapon}
          onClick={props.onClick}
        >
          <WeaponRep grid={grid.weapons} />
        </RepSegment>
      )
    }
  }

  const summonSegment = () => {
    return (
      <RepSegment
        controlGroup="grid"
        inputName="summons"
        name={t('party.segmented_control.summons')}
        selected={props.selectedTab === GridType.Summon}
        onClick={props.onClick}
      >
        <SummonRep grid={grid.summons} />
      </RepSegment>
    )
  }

  return (
    <nav
      className={classNames({
        [styles.nav]: true,
      })}
    >
      <SegmentedControl gap={true} grow={true} elementClass={getElement()}>
        {characterSegment()}
        {weaponSegment()}
        {summonSegment()}
      </SegmentedControl>
    </nav>
  )
}

export default PartySegmentedControl
