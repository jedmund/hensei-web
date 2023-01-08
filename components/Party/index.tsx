import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import clonedeep from 'lodash.clonedeep'

import PartySegmentedControl from '~components/PartySegmentedControl'
import PartyDetails from '~components/PartyDetails'
import WeaponGrid from '~components/WeaponGrid'
import SummonGrid from '~components/SummonGrid'
import CharacterGrid from '~components/CharacterGrid'

import api from '~utils/api'
import { appState, initialAppState } from '~utils/appState'
import { GridType, TeamElement } from '~utils/enums'
import type { DetailsObject } from '~types'

import './index.scss'

// Props
interface Props {
  new?: boolean
  team?: Party
  raids: Raid[][]
  pushHistory?: (path: string) => void
}

const Party = (props: Props) => {
  // Set up router
  const router = useRouter()

  // Set up states
  const { party } = useSnapshot(appState)
  const [currentTab, setCurrentTab] = useState<GridType>(GridType.Weapon)

  // Reset state on first load
  useEffect(() => {
    const resetState = clonedeep(initialAppState)
    appState.grid = resetState.grid
    if (props.team) storeParty(props.team)
  }, [])

  // Methods: Creating a new party
  async function createParty(extra: boolean = false) {
    return await api.endpoints.parties.create({
      party: {
        extra: extra,
      },
    })
  }

  // Methods: Updating the party's details
  function checkboxChanged(event: React.ChangeEvent<HTMLInputElement>) {
    appState.party.extra = event.target.checked

    if (party.id) {
      api.endpoints.parties.update(party.id, {
        party: { extra: event.target.checked },
      })
    }
  }

  async function updateDetails(details: DetailsObject) {
    if (
      appState.party.name !== details.name ||
      appState.party.description !== details.description ||
      appState.party.raid?.id !== details.raid?.id
    ) {
      if (!appState.party.id)
        await createParty().then((response) => {
          // If the party has no ID, create a new party
          const party = response.data.party
          storeParty(party)

          // Then, push the browser history to the new party's URL
          if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)
        })

      // Update the party
      await sendUpdate(details)
    }
  }

  async function sendUpdate(details: DetailsObject) {
    if (appState.party.id) {
      return await api.endpoints.parties
        .update(appState.party.id, {
          party: {
            name: details.name,
            description: details.description,
            raid_id: details.raid?.id,
            charge_attack: details.chargeAttack,
            full_auto: details.fullAuto,
            auto_guard: details.autoGuard,
            clear_time: details.clearTime,
            button_count: details.buttonCount,
            chain_count: details.chainCount,
            turn_count: details.turnCount,
          },
        })
        .then(() => {
          appState.party.name = details.name
          appState.party.description = details.description
          appState.party.raid = details.raid

          appState.party.chargeAttack = details.chargeAttack
          appState.party.fullAuto = details.fullAuto
          appState.party.autoGuard = details.autoGuard

          appState.party.clearTime = details.clearTime
          appState.party.buttonCount = details.buttonCount
          appState.party.chainCount = details.chainCount
          appState.party.turnCount = details.turnCount

          appState.party.updated_at = party.updated_at
        })
    }
  }

  // Deleting the party
  function deleteTeam(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    if (appState.party.editable && appState.party.id) {
      api.endpoints.parties
        .destroy({ id: appState.party.id })
        .then(() => {
          // Push to route
          router.push('/')

          // Clean state
          const resetState = clonedeep(initialAppState)
          Object.keys(resetState).forEach((key) => {
            appState[key] = resetState[key]
          })

          // Set party to be editable
          appState.party.editable = true
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }

  // Methods: Storing party data
  const storeParty = function (team: Party) {
    // Store the important party and state-keeping values
    appState.party.name = team.name
    appState.party.description = team.description
    appState.party.raid = team.raid
    appState.party.updated_at = team.updated_at
    appState.party.job = team.job
    appState.party.jobSkills = team.job_skills

    appState.party.id = team.id
    appState.party.extra = team.extra
    appState.party.user = team.user
    appState.party.favorited = team.favorited
    appState.party.created_at = team.created_at
    appState.party.updated_at = team.updated_at

    appState.party.detailsVisible = false

    // Populate state
    storeCharacters(team.characters)
    storeWeapons(team.weapons)
    storeSummons(team.summons)
  }

  const storeCharacters = (list: Array<GridCharacter>) => {
    list.forEach((object: GridCharacter) => {
      if (object.position != null)
        appState.grid.characters[object.position] = object
    })
  }

  const storeWeapons = (list: Array<GridWeapon>) => {
    list.forEach((gridObject: GridWeapon) => {
      if (gridObject.mainhand) {
        appState.grid.weapons.mainWeapon = gridObject
        appState.party.element = gridObject.object.element
      } else if (!gridObject.mainhand && gridObject.position != null) {
        appState.grid.weapons.allWeapons[gridObject.position] = gridObject
      }
    })
  }

  const storeSummons = (list: Array<GridSummon>) => {
    list.forEach((gridObject: GridSummon) => {
      if (gridObject.main) appState.grid.summons.mainSummon = gridObject
      else if (gridObject.friend)
        appState.grid.summons.friendSummon = gridObject
      else if (
        !gridObject.main &&
        !gridObject.friend &&
        gridObject.position != null
      )
        appState.grid.summons.allSummons[gridObject.position] = gridObject
    })
  }

  // Methods: Navigating with segmented control
  function segmentClicked(event: React.ChangeEvent<HTMLInputElement>) {
    switch (event.target.value) {
      case 'class':
        setCurrentTab(GridType.Class)
        break
      case 'characters':
        setCurrentTab(GridType.Character)
        break
      case 'weapons':
        setCurrentTab(GridType.Weapon)
        break
      case 'summons':
        setCurrentTab(GridType.Summon)
        break
      default:
        break
    }
  }

  // Render: JSX components
  const navigation = (
    <PartySegmentedControl
      selectedTab={currentTab}
      onClick={segmentClicked}
      onCheckboxChange={checkboxChanged}
    />
  )

  const weaponGrid = (
    <WeaponGrid
      new={props.new || false}
      weapons={props.team?.weapons}
      createParty={createParty}
      pushHistory={props.pushHistory}
    />
  )

  const summonGrid = (
    <SummonGrid
      new={props.new || false}
      summons={props.team?.summons}
      createParty={createParty}
      pushHistory={props.pushHistory}
    />
  )

  const characterGrid = (
    <CharacterGrid
      new={props.new || false}
      characters={props.team?.characters}
      createParty={createParty}
      pushHistory={props.pushHistory}
    />
  )

  const currentGrid = () => {
    switch (currentTab) {
      case GridType.Character:
        return characterGrid
      case GridType.Weapon:
        return weaponGrid
      case GridType.Summon:
        return summonGrid
    }
  }

  return (
    <React.Fragment>
      {navigation}
      <section id="Party">{currentGrid()}</section>
      <PartyDetails
        party={props.team}
        new={props.new || false}
        editable={party.editable}
        updateCallback={updateDetails}
        deleteCallback={deleteTeam}
      />
    </React.Fragment>
  )
}

export default Party
