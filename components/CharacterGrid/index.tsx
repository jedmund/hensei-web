/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getCookie } from "cookies-next"
import { useSnapshot } from "valtio"

import { AxiosResponse } from "axios"
import debounce from "lodash.debounce"

import JobSection from "~components/JobSection"
import CharacterUnit from "~components/CharacterUnit"

import api from "~utils/api"
import { appState } from "~utils/appState"

import "./index.scss"
import CharacterConflictModal from "~components/CharacterConflictModal"

// Props
interface Props {
  new: boolean
  characters?: GridCharacter[]
  createParty: () => Promise<AxiosResponse<any, any>>
  pushHistory?: (path: string) => void
}

const CharacterGrid = (props: Props) => {
  // Constants
  const numCharacters: number = 5

  // Cookies
  const cookie = getCookie("account")
  const accountData: AccountCookie = cookie
    ? JSON.parse(cookie as string)
    : null
  const headers = accountData
    ? { headers: { Authorization: `Bearer ${accountData.token}` } }
    : {}

  // Set up state for view management
  const { party, grid } = useSnapshot(appState)
  const [slug, setSlug] = useState()
  const [modalOpen, setModalOpen] = useState(false)

  // Set up state for conflict management
  const [incoming, setIncoming] = useState<Character>()
  const [conflicts, setConflicts] = useState<GridCharacter[]>([])
  const [position, setPosition] = useState(0)

  // Create a temporary state to store previous character uncap values
  const [previousUncapValues, setPreviousUncapValues] = useState<{
    [key: number]: number | undefined
  }>({})

  // Set the editable flag only on first load
  useEffect(() => {
    // If user is logged in and matches
    if (
      (accountData && party.user && accountData.userId === party.user.id) ||
      props.new
    )
      appState.party.editable = true
    else appState.party.editable = false
  }, [props.new, accountData, party])

  // Initialize an array of current uncap values for each characters
  useEffect(() => {
    let initialPreviousUncapValues: { [key: number]: number } = {}
    Object.values(appState.grid.characters).map((o) => {
      o ? (initialPreviousUncapValues[o.position] = o.uncap_level) : -1
    })
    setPreviousUncapValues(initialPreviousUncapValues)
  }, [appState.grid.characters])

  // Methods: Adding an object from search
  function receiveCharacterFromSearch(
    object: Character | Weapon | Summon,
    position: number
  ) {
    const character = object as Character

    if (!party.id) {
      props.createParty().then((response) => {
        const party = response.data.party
        appState.party.id = party.id
        setSlug(party.shortcode)

        if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)
        saveCharacter(party.id, character, position)
          .then((response) => storeGridCharacter(response.data.grid_character))
          .catch((error) => console.error(error))
      })
    } else {
      if (party.editable)
        saveCharacter(party.id, character, position)
          .then((response) => handleCharacterResponse(response.data))
          .catch((error) => console.error(error))
    }
  }

  async function handleCharacterResponse(data: any) {
    if (data.hasOwnProperty("conflicts")) {
      setIncoming(data.incoming)
      setConflicts(data.conflicts)
      setPosition(data.position)
      setModalOpen(true)
    } else {
      storeGridCharacter(data.grid_character)
    }
  }

  async function saveCharacter(
    partyId: string,
    character: Character,
    position: number
  ) {
    return await api.endpoints.characters.create(
      {
        character: {
          party_id: partyId,
          character_id: character.id,
          position: position,
          uncap_level: characterUncapLevel(character),
        },
      },
      headers
    )
  }

  function storeGridCharacter(gridCharacter: GridCharacter) {
    appState.grid.characters[gridCharacter.position] = gridCharacter
  }

  async function resolveConflict() {
    if (incoming && conflicts.length > 0) {
      await api
        .resolveCharacterConflict({
          incoming: incoming.id,
          conflicting: conflicts.map((c) => c.id),
          position: position,
          params: headers,
        })
        .then((response) => {
          // Store new character in state
          storeGridCharacter(response.data.grid_character)

          // Remove conflicting characters from state
          conflicts.forEach(
            (c) => (appState.grid.characters[c.position] = undefined)
          )

          // Reset conflict
          resetConflict()

          // Close modal
          setModalOpen(false)
        })
    }
  }

  function resetConflict() {
    setPosition(-1)
    setConflicts([])
    setIncoming(undefined)
  }

  // Methods: Helpers
  function characterUncapLevel(character: Character) {
    let uncapLevel

    if (character.special) {
      uncapLevel = 3
      if (character.uncap.ulb) uncapLevel = 5
      else if (character.uncap.flb) uncapLevel = 4
    } else {
      uncapLevel = 4
      if (character.uncap.ulb) uncapLevel = 6
      else if (character.uncap.flb) uncapLevel = 5
    }

    return uncapLevel
  }

  // Methods: Updating uncap level
  // Note: Saves, but debouncing is not working properly
  async function saveUncap(id: string, position: number, uncapLevel: number) {
    storePreviousUncapValue(position)

    try {
      if (uncapLevel != previousUncapValues[position])
        await api.updateUncap("character", id, uncapLevel).then((response) => {
          storeGridCharacter(response.data.grid_character)
        })
    } catch (error) {
      console.error(error)

      // Revert optimistic UI
      updateUncapLevel(position, previousUncapValues[position])

      // Remove optimistic key
      let newPreviousValues = { ...previousUncapValues }
      delete newPreviousValues[position]
      setPreviousUncapValues(newPreviousValues)
    }
  }

  function initiateUncapUpdate(
    id: string,
    position: number,
    uncapLevel: number
  ) {
    memoizeAction(id, position, uncapLevel)

    // Optimistically update UI
    updateUncapLevel(position, uncapLevel)
  }

  const memoizeAction = useCallback(
    (id: string, position: number, uncapLevel: number) => {
      debouncedAction(id, position, uncapLevel)
    },
    [props, previousUncapValues]
  )

  const debouncedAction = useMemo(
    () =>
      debounce((id, position, number) => {
        saveUncap(id, position, number)
      }, 500),
    [props, saveUncap]
  )

  const updateUncapLevel = (
    position: number,
    uncapLevel: number | undefined
  ) => {
    const character = appState.grid.characters[position]
    if (character && uncapLevel) {
      character.uncap_level = uncapLevel
      appState.grid.characters[position] = character
    }
  }

  function storePreviousUncapValue(position: number) {
    // Save the current value in case of an unexpected result
    let newPreviousValues = { ...previousUncapValues }

    if (grid.characters[position]) {
      newPreviousValues[position] = grid.characters[position]?.uncap_level
      setPreviousUncapValues(newPreviousValues)
    }
  }

  // Render: JSX components
  return (
    <div>
      <div id="CharacterGrid">
        <JobSection />
        <CharacterConflictModal
          open={modalOpen}
          incomingCharacter={incoming}
          conflictingCharacters={conflicts}
          desiredPosition={position}
          resolveConflict={resolveConflict}
          resetConflict={resetConflict}
        />
        <ul id="grid_characters">
          {Array.from(Array(numCharacters)).map((x, i) => {
            return (
              <li key={`grid_unit_${i}`}>
                <CharacterUnit
                  gridCharacter={grid.characters[i]}
                  editable={party.editable}
                  position={i}
                  updateObject={receiveCharacterFromSearch}
                  updateUncap={initiateUncapUpdate}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default CharacterGrid
