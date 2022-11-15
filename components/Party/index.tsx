import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSnapshot } from "valtio"
import { getCookie } from "cookies-next"
import clonedeep from "lodash.clonedeep"

import PartySegmentedControl from "~components/PartySegmentedControl"
import PartyDetails from "~components/PartyDetails"
import WeaponGrid from "~components/WeaponGrid"
import SummonGrid from "~components/SummonGrid"
import CharacterGrid from "~components/CharacterGrid"

import api from "~utils/api"
import { appState, initialAppState } from "~utils/appState"
import { GridType, TeamElement } from "~utils/enums"

import "./index.scss"

// Props
interface Props {
  new?: boolean
  team?: Party
  raids: Raid[][]
  pushHistory?: (path: string) => void
}

const Party = (props: Props) => {
  // Cookies
  const cookie = getCookie("account")
  const accountData: AccountCookie = cookie
    ? JSON.parse(cookie as string)
    : null

  const headers = useMemo(() => {
    return accountData
      ? { headers: { Authorization: `Bearer ${accountData.token}` } }
      : {}
  }, [accountData])

  // Set up router
  const router = useRouter()

  // Set up states
  const { party } = useSnapshot(appState)
  const jobState = party.job

  const [job, setJob] = useState<Job>()
  const [currentTab, setCurrentTab] = useState<GridType>(GridType.Weapon)

  // Reset state on first load
  useEffect(() => {
    const resetState = clonedeep(initialAppState)
    appState.grid = resetState.grid
    if (props.team) storeParty(props.team)
  }, [])

  useEffect(() => {
    setJob(jobState)
  }, [jobState])

  useEffect(() => {
    jobChanged()
  }, [job])

  // Methods: Creating a new party
  async function createParty(extra: boolean = false) {
    let body = {
      party: {
        ...(accountData && { user_id: accountData.userId }),
        extra: extra,
      },
    }

    return await api.endpoints.parties.create(body, headers)
  }

  // Methods: Updating the party's details
  function checkboxChanged(event: React.ChangeEvent<HTMLInputElement>) {
    appState.party.extra = event.target.checked

    if (party.id) {
      api.endpoints.parties.update(
        party.id,
        {
          party: { extra: event.target.checked },
        },
        headers
      )
    }
  }

  function jobChanged() {
    if (party.id) {
      api.endpoints.parties.update(
        party.id,
        {
          party: { job_id: job ? job.id : "" },
        },
        headers
      )
    }
  }

  function updateDetails(name?: string, description?: string, raid?: Raid) {
    if (
      appState.party.name !== name ||
      appState.party.description !== description ||
      appState.party.raid?.id !== raid?.id
    ) {
      if (appState.party.id)
        api.endpoints.parties
          .update(
            appState.party.id,
            {
              party: {
                name: name,
                description: description,
                raid_id: raid?.id,
              },
            },
            headers
          )
          .then(() => {
            appState.party.name = name
            appState.party.description = description
            appState.party.raid = raid
            appState.party.updated_at = party.updated_at
          })
    }
  }

  // Deleting the party
  function deleteTeam(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    if (appState.party.editable && appState.party.id) {
      api.endpoints.parties
        .destroy({ id: appState.party.id, params: headers })
        .then(() => {
          // Push to route
          router.push("/")

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
  const storeParty = function (party: Party) {
    // Store the important party and state-keeping values
    appState.party.id = party.id
    appState.party.extra = party.extra
    appState.party.user = party.user
    appState.party.favorited = party.favorited
    appState.party.created_at = party.created_at
    appState.party.updated_at = party.updated_at

    // Populate state
    storeCharacters(party.characters)
    storeWeapons(party.weapons)
    storeSummons(party.summons)
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
      case "class":
        setCurrentTab(GridType.Class)
        break
      case "characters":
        setCurrentTab(GridType.Character)
        break
      case "weapons":
        setCurrentTab(GridType.Weapon)
        break
      case "summons":
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
    <div>
      {navigation}
      <section id="Party">{currentGrid()}</section>
      {
        <PartyDetails
          editable={party.editable}
          updateCallback={updateDetails}
          deleteCallback={deleteTeam}
        />
      }
    </div>
  )
}

export default Party
