import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import clonedeep from 'lodash.clonedeep'
import ls from 'local-storage'

import PartySegmentedControl from '~components/PartySegmentedControl'
import PartyDetails from '~components/PartyDetails'
import WeaponGrid from '~components/WeaponGrid'
import SummonGrid from '~components/SummonGrid'
import CharacterGrid from '~components/CharacterGrid'

import api from '~utils/api'
import { appState, initialAppState } from '~utils/appState'
import { GridType } from '~utils/enums'
import { retrieveCookies } from '~utils/retrieveCookies'
import { accountCookie, setEditKey, unsetEditKey } from '~utils/userToken'

import type { DetailsObject } from '~types'

import './index.scss'

// Props
interface Props {
  new?: boolean
  team?: Party
  raids: Raid[][]
  selectedTab: GridType
  pushHistory?: (path: string) => void
}

const defaultProps = {
  selectedTab: GridType.Weapon,
}

const Party = (props: Props) => {
  // Set up router
  const router = useRouter()

  // Set up states
  const { party } = useSnapshot(appState)
  const [editable, setEditable] = useState(false)
  const [currentTab, setCurrentTab] = useState<GridType>(GridType.Weapon)

  // Retrieve cookies
  const cookies = retrieveCookies()

  // Reset state on first load
  useEffect(() => {
    const resetState = clonedeep(initialAppState)
    appState.grid = resetState.grid
    if (props.team) storeParty(props.team)
  }, [])

  // Set editable on first load
  useEffect(() => {
    // Get cookie
    const cookie = getCookie('account')
    const accountData: AccountCookie = cookie
      ? JSON.parse(cookie as string)
      : null

    let editable = false
    unsetEditKey()

    if (props.new) editable = true

    if (accountData && props.team && !props.new) {
      if (accountData.token) {
        // Authenticated
        if (props.team.user && accountData.userId === props.team.user.id) {
          editable = true
        }
      } else {
        // Not authenticated
        if (!props.team.user && accountData.userId === props.team.local_id) {
          // Set editable
          editable = true

          // Also set edit key header
          setEditKey(props.team.id, props.team.user)
        }
      }
    }

    appState.party.editable = editable
    setEditable(editable)
  })

  // Set selected tab from props
  useEffect(() => {
    setCurrentTab(props.selectedTab)
  }, [props.selectedTab])

  // Methods: Creating a new party
  async function createParty(details?: DetailsObject) {
    let payload = {}
    if (details) payload = formatDetailsObject(details)

    return await api.endpoints.parties
      .create({ ...payload, ...localId() })
      .then((response) => storeParty(response.data.party))
  }

  // Methods: Updating the party's details
  async function updateDetails(details: DetailsObject) {
    if (!props.team) return await createParty(details)
    else updateParty(details)
  }

  function formatDetailsObject(details: DetailsObject) {
    const payload: { [key: string]: any } = {}

    if (details.name) payload.name = details.name
    if (details.description) payload.description = details.description
    if (details.raid) payload.raid_id = details.raid.id
    if (details.chargeAttack) payload.charge_attack = details.chargeAttack
    if (details.fullAuto) payload.full_auto = details.fullAuto
    if (details.autoGuard) payload.auto_guard = details.autoGuard
    if (details.clearTime) payload.clear_time = details.clearTime
    if (details.buttonCount) payload.button_count = details.buttonCount
    if (details.chainCount) payload.chain_count = details.chainCount
    if (details.turnCount) payload.turn_count = details.turnCount
    if (details.extra) payload.extra = details.extra
    if (details.job) payload.job_id = details.job.id

    if (Object.keys(payload).length > 1) return { party: payload }
    else return {}
  }

  async function updateParty(details: DetailsObject) {
    const payload = formatDetailsObject(details)

    if (props.team && props.team.id) {
      return await api.endpoints.parties
        .update(props.team.id, payload)
        .then((response) => storeParty(response.data.party))
    }
  }

  function checkboxChanged(event: React.ChangeEvent<HTMLInputElement>) {
    appState.party.extra = event.target.checked

    // Only save if this is a saved party
    if (props.team && props.team.id) {
      api.endpoints.parties.update(props.team.id, {
        party: { extra: event.target.checked },
      })
    }
  }

  // Deleting the party
  function deleteTeam() {
    if (props.team && editable) {
      api.endpoints.parties
        .destroy({ id: props.team.id })
        .then(() => {
          // Push to route
          if (cookies && cookies.account.username) {
            router.push(`/${cookies.account.username}`)
          } else {
            router.push('/')
          }

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
  const storeParty = function (team: any) {
    // Store the important party and state-keeping values in global state
    appState.party.name = team.name
    appState.party.description = team.description
    appState.party.raid = team.raid
    appState.party.updated_at = team.updated_at
    appState.party.job = team.job
    appState.party.jobSkills = team.job_skills
    appState.party.accessory = team.accessory

    appState.party.id = team.id
    appState.party.shortcode = team.shortcode
    appState.party.extra = team.extra
    appState.party.user = team.user
    appState.party.favorited = team.favorited
    appState.party.remix = team.remix
    appState.party.remixes = team.remixes
    appState.party.sourceParty = team.source_party
    appState.party.created_at = team.created_at
    appState.party.updated_at = team.updated_at

    appState.party.detailsVisible = false

    // Store the edit key in local storage
    if (team.edit_key) {
      storeEditKey(team.id, team.edit_key)
      setEditKey(team.id, team.user)
    }

    // Populate state
    storeCharacters(team.characters)
    storeWeapons(team.weapons)
    storeSummons(team.summons)

    // Create a string to send the user back to the tab they're currently on
    let tab = ''
    if (currentTab === GridType.Character) {
      tab = 'characters'
    } else if (currentTab === GridType.Summon) {
      tab = 'summons'
    }

    // Then, push the browser history to the new party's URL
    if (props.pushHistory) {
      props.pushHistory(`/p/${team.shortcode}/${tab}`)
    }

    return team
  }

  const storeEditKey = (id: string, key: string) => {
    ls(id, key)
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
    const path = [
      router.asPath.split('/').filter((el) => el != '')[1],
      event.target.value,
    ].join('/')

    switch (event.target.value) {
      case 'characters':
        router.replace(path)
        setCurrentTab(GridType.Character)
        break
      case 'weapons':
        router.replace(path)
        setCurrentTab(GridType.Weapon)
        break
      case 'summons':
        router.replace(path)
        setCurrentTab(GridType.Summon)
        break
      default:
        break
    }
  }

  // Methods: Unauth validation
  function localId() {
    const cookie = accountCookie()
    const parsed = JSON.parse(cookie as string)
    if (parsed && !parsed.token) {
      return { local_id: parsed.userId }
    } else return {}
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
      editable={editable}
      weapons={props.team?.weapons}
      createParty={createParty}
      pushHistory={props.pushHistory}
    />
  )

  const summonGrid = (
    <SummonGrid
      new={props.new || false}
      editable={editable}
      summons={props.team?.summons}
      createParty={createParty}
      pushHistory={props.pushHistory}
    />
  )

  const characterGrid = (
    <CharacterGrid
      new={props.new || false}
      editable={editable}
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

Party.defaultProps = defaultProps

export default Party
