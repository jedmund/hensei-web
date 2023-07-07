import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { subscribe, useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import clonedeep from 'lodash.clonedeep'

import Alert from '~components/common/Alert'
import PartySegmentedControl from '~components/party/PartySegmentedControl'
import PartyFooter from '~components/party/PartyFooter'
import PartyHeader from '~components/party/PartyHeader'
import WeaponGrid from '~components/weapon/WeaponGrid'
import SummonGrid from '~components/summon/SummonGrid'
import CharacterGrid from '~components/character/CharacterGrid'

import api from '~utils/api'
import { accountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'
import { getLocalId } from '~utils/localId'
import { GridType } from '~utils/enums'
import { retrieveCookies } from '~utils/retrieveCookies'
import { setEditKey, storeEditKey, unsetEditKey } from '~utils/userToken'

import type { CharacterOverMastery, DetailsObject } from '~types'
import { ElementMap } from '~utils/elements'

// Props
interface Props {
  new?: boolean
  party?: Party
  selectedTab: GridType
  raidGroups: RaidGroup[]
  handleTabChanged: (value: string) => void
  pushHistory?: (path: string) => void
}

const defaultProps = {
  selectedTab: GridType.Weapon,
}

const Party = (props: Props) => {
  // Set up router
  const router = useRouter()

  // Localization
  const { t } = useTranslation('common')

  // Set up states
  const { party } = useSnapshot(appState)
  const [updatedParty, setUpdatedParty] = useState<Party | undefined>()
  const [editable, setEditable] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Retrieve cookies
  const cookies = retrieveCookies()

  // Reset state on first load
  useEffect(() => {
    const resetState = clonedeep(initialAppState)
    appState.grid = resetState.grid
    if (props.party) {
      storeParty(props.party)
      setUpdatedParty(props.party)
    }
  }, [])

  // Subscribe to app state to listen for account changes and
  // unsubscribe when component is unmounted
  const unsubscribe = subscribe(accountState, () => {
    setRefresh(true)
  })

  useEffect(() => () => unsubscribe(), [])

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

    if (accountData && props.party && !props.new) {
      if (accountData.token) {
        // Authenticated
        if (props.party.user && accountData.userId === props.party.user.id) {
          editable = true
        }
      } else {
        // Not authenticated
        if (!props.party.user && accountData.userId === props.party.localId) {
          // Set editable
          editable = true

          // Also set edit key header
          setEditKey(props.party.id, props.party.user)
        }
      }
    }

    appState.party.editable = editable
    setEditable(editable)
  }, [refresh])

  // Methods: Creating a new party
  async function createParty(details?: DetailsObject) {
    let payload = {}
    if (details) payload = formatDetailsObject(details)

    return await api.endpoints.parties.create(payload).then((response) => {
      storeParty(response.data.party)
      setUpdatedParty(response.data.party)
      return Promise.resolve(response.data.party)
    })
  }

  async function updateParty(details: DetailsObject) {
    const payload = formatDetailsObject(details)

    if (props.party && props.party.id) {
      return await api.endpoints.parties
        .update(props.party.id, payload)
        .then((response) => {
          storeParty(response.data.party)
          setUpdatedParty(response.data.party)
          return Promise.resolve(response.data.party)
        })
        .catch((error) => {
          const data = error.response.data
          if (data.errors && Object.keys(data.errors).includes('guidebooks')) {
            const message = t('errors.validation.guidebooks')
            setErrorMessage(message)
          }
        })
    }
  }

  // Methods: Updating the party's details
  async function updateDetails(details: DetailsObject) {
    if (!props.party) return await createParty(details)
    else return await updateParty(details)
  }

  function formatDetailsObject(details: DetailsObject) {
    const payload: { [key: string]: any } = {}

    if (details.name) payload.name = details.name
    if (details.description) payload.description = details.description
    if (details.raid) payload.raid_id = details.raid.id
    if (details.chargeAttack != undefined)
      payload.charge_attack = details.chargeAttack
    if (details.fullAuto != undefined) payload.full_auto = details.fullAuto
    if (details.autoGuard != undefined) payload.auto_guard = details.autoGuard
    if (details.autoSummon != undefined)
      payload.auto_summon = details.autoSummon
    if (details.clearTime) payload.clear_time = details.clearTime
    if (details.buttonCount !== undefined)
      payload.button_count = details.buttonCount
    if (details.chainCount !== undefined)
      payload.chain_count = details.chainCount
    if (details.turnCount !== undefined) payload.turn_count = details.turnCount
    if (details.extra != undefined) payload.extra = details.extra
    if (details.job) payload.job_id = details.job.id
    if (details.guidebook1_id) payload.guidebook1_id = details.guidebook1_id
    if (details.guidebook2_id) payload.guidebook2_id = details.guidebook2_id
    if (details.guidebook3_id) payload.guidebook3_id = details.guidebook3_id
    if (getLocalId()) payload.local_id = getLocalId()

    if (Object.keys(payload).length >= 1) return { party: payload }
    else return {}
  }

  function cancelAlert() {
    setErrorMessage('')
  }

  function checkboxChanged(enabled: boolean) {
    appState.party.details.extra = enabled

    // Only save if this is a saved party
    if (props.party && props.party.id) {
      api.endpoints.parties.update(props.party.id, {
        party: { extra: enabled },
      })
    }
  }

  function updateGuidebook(book: Guidebook | undefined, position: number) {
    let id: string | undefined = ''

    if (book) id = book.id
    else if (!book) id = 'undefined'
    else id = undefined

    const details: DetailsObject = {
      guidebook1_id: position === 1 ? id : undefined,
      guidebook2_id: position === 2 ? id : undefined,
      guidebook3_id: position === 3 ? id : undefined,
    }

    if (props.party && props.party.id) {
      updateParty(details)
    } else {
      createParty(details)
    }
  }

  // Remixing the party
  function remixTeam() {
    // setOriginalName(partySnapshot.name ? partySnapshot.name : t('no_title'))

    if (props.party && props.party.shortcode) {
      const body = { local_id: getLocalId() }
      api
        .remix({ shortcode: props.party.shortcode, body: body })
        .then((response) => {
          const remix = response.data.party

          // Store the edit key in local storage
          if (remix.edit_key) {
            storeEditKey(remix.id, remix.edit_key)
            setEditKey(remix.id, remix.user)
          }

          router.push(`/p/${remix.shortcode}`)
          // setRemixToastOpen(true)
        })
    }
  }

  // Deleting the party
  function deleteTeam() {
    if (props.party && editable) {
      api.endpoints.parties
        .destroy({ id: props.party.id })
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
    appState.party.description = team.description ? team.description : ''
    appState.party.raid = team.raid
    appState.party.protagonist.job = team.job
    appState.party.protagonist.skills = team.job_skills
    appState.party.protagonist.accessory = team.accessory

    appState.party.details.chargeAttack = team.charge_attack
    appState.party.details.fullAuto = team.full_auto
    appState.party.details.autoGuard = team.auto_guard
    appState.party.details.autoSummon = team.auto_summon
    appState.party.details.clearTime = team.clear_time
    appState.party.details.buttonCount =
      team.button_count !== null ? team.button_count : undefined
    appState.party.details.chainCount =
      team.chain_count !== null ? team.chain_count : undefined
    appState.party.details.turnCount =
      team.turn_count !== null ? team.turn_count : undefined

    appState.party.id = team.id
    appState.party.shortcode = team.shortcode
    appState.party.details.extra = team.extra
    appState.party.guidebooks = team.guidebooks
    appState.party.user = team.user
    appState.party.social.favorited = team.favorited
    appState.party.social.remix = team.remix
    appState.party.social.remixes = team.remixes
    appState.party.social.sourceParty = team.source_party
    appState.party.timestamps.createdAt = team.created_at
    appState.party.timestamps.updatedAt = team.updated_at

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
    if (props.selectedTab === GridType.Character) {
      tab = 'characters'
    } else if (props.selectedTab === GridType.Summon) {
      tab = 'summons'
    }

    // Then, push the browser history to the new party's URL
    if (props.pushHistory) {
      props.pushHistory(`/p/${team.shortcode}/${tab}`)
    }

    return team
  }

  const storeCharacters = (list: Array<GridCharacter>) => {
    list.forEach((object: GridCharacter) => {
      let character = clonedeep(object)

      if (character.mastery.overMastery) {
        const overMastery: CharacterOverMastery = {
          1: object.mastery.overMastery[0],
          2: object.mastery.overMastery[1],
          3: object.mastery.overMastery[2],
          4: object.mastery.overMastery[3],
        }

        character.mastery.overMastery = overMastery
      }

      if (character.position != null) {
        appState.grid.characters[object.position] = character
      }
    })
  }

  const storeWeapons = (list: Array<GridWeapon>) => {
    list.forEach((gridObject: GridWeapon) => {
      if (gridObject.mainhand) {
        appState.grid.weapons.mainWeapon = gridObject
        appState.party.element = gridObject.object.element
      } else if (!gridObject.mainhand && gridObject.position !== null) {
        let weapon = clonedeep(gridObject)
        if (
          weapon.object.element === ElementMap.null &&
          weapon.element === ElementMap.null
        )
          weapon.element = gridObject.object.element

        appState.grid.weapons.allWeapons[gridObject.position] = weapon
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
    props.handleTabChanged(event.target.value)
  }

  // Render: JSX components
  const errorAlert = () => {
    return (
      <Alert
        open={errorMessage.length > 0}
        message={errorMessage}
        cancelAction={cancelAlert}
        cancelActionText={t('buttons.confirm')}
      />
    )
  }

  const navigation = (
    <PartySegmentedControl
      selectedTab={props.selectedTab}
      onClick={segmentClicked}
    />
  )

  const weaponGrid = (
    <WeaponGrid
      new={props.new || false}
      editable={editable}
      weapons={props.party?.grid.weapons}
      guidebooks={props.party?.guidebooks}
      createParty={createParty}
      pushHistory={props.pushHistory}
      updateExtra={checkboxChanged}
      updateGuidebook={updateGuidebook}
    />
  )

  const summonGrid = (
    <SummonGrid
      new={props.new || false}
      editable={editable}
      summons={props.party?.grid.summons}
      createParty={createParty}
      pushHistory={props.pushHistory}
    />
  )

  const characterGrid = (
    <CharacterGrid
      new={props.new || false}
      editable={editable}
      characters={props.party?.grid.characters}
      createParty={createParty}
      pushHistory={props.pushHistory}
    />
  )

  const currentGrid = () => {
    switch (props.selectedTab) {
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
      {errorAlert()}

      <PartyHeader
        party={updatedParty}
        new={props.new || false}
        editable={props.new ? true : party.editable}
        raidGroups={props.raidGroups}
        deleteCallback={deleteTeam}
        remixCallback={remixTeam}
        updateCallback={updateDetails}
      />

      {navigation}

      <section id="Party">{currentGrid()}</section>

      <PartyFooter
        party={updatedParty}
        new={props.new || false}
        editable={party.editable}
        raidGroups={props.raidGroups}
        remixCallback={remixTeam}
        updateCallback={updateDetails}
      />
    </React.Fragment>
  )
}

Party.defaultProps = defaultProps

export default Party
