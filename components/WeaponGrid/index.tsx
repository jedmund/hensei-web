/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

import { AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import WeaponUnit from '~components/WeaponUnit'
import ExtraWeapons from '~components/ExtraWeapons'

import api from '~utils/api'
import { appState } from '~utils/appState'

import type { SearchableObject } from '~types'

import './index.scss'
import WeaponConflictModal from '~components/WeaponConflictModal'
import Alert from '~components/Alert'
import { accountState } from '~utils/accountState'

// Props
interface Props {
  new: boolean
  weapons?: GridWeapon[]
  createParty: (extra: boolean) => Promise<AxiosResponse<any, any>>
  pushHistory?: (path: string) => void
}

const WeaponGrid = (props: Props) => {
  // Constants
  const numWeapons: number = 9

  // Localization
  const { t } = useTranslation('common')

  // Cookies
  const cookie = getCookie('account')
  const accountData: AccountCookie = cookie
    ? JSON.parse(cookie as string)
    : null

  // Set up state for view management
  const { party, grid } = useSnapshot(appState)
  const [slug, setSlug] = useState()
  const [modalOpen, setModalOpen] = useState(false)
  const [showIncompatibleAlert, setShowIncompatibleAlert] = useState(false)

  // Set up state for conflict management
  const [incoming, setIncoming] = useState<Weapon>()
  const [conflicts, setConflicts] = useState<GridWeapon[]>([])
  const [position, setPosition] = useState(0)

  // Create a temporary state to store previous weapon uncap values
  const [previousUncapValues, setPreviousUncapValues] = useState<{
    [key: number]: number
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

  // Initialize an array of current uncap values for each weapon
  useEffect(() => {
    let initialPreviousUncapValues: { [key: number]: number } = {}

    if (appState.grid.weapons.mainWeapon)
      initialPreviousUncapValues[-1] =
        appState.grid.weapons.mainWeapon.uncap_level

    Object.values(appState.grid.weapons.allWeapons).map((o) =>
      o ? (initialPreviousUncapValues[o.position] = o.uncap_level) : 0
    )

    setPreviousUncapValues(initialPreviousUncapValues)
  }, [appState.grid.weapons.mainWeapon, appState.grid.weapons.allWeapons])

  // Methods: Adding an object from search
  function receiveWeaponFromSearch(object: SearchableObject, position: number) {
    const weapon = object as Weapon
    if (position == 1) appState.party.element = weapon.element

    if (!party.id) {
      props.createParty(party.extra).then((response) => {
        const party = response.data.party
        appState.party.id = party.id
        setSlug(party.shortcode)

        if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)

        saveWeapon(party.id, weapon, position).then((response) =>
          storeGridWeapon(response.data.grid_weapon)
        )
      })
    } else {
      if (party.editable)
        saveWeapon(party.id, weapon, position)
          .then((response) => handleWeaponResponse(response.data))
          .catch((error) => {
            const code = error.response.status
            const data = error.response.data
            if (code === 422) {
              if (data.code === 'incompatible_weapon_for_position') {
                setShowIncompatibleAlert(true)
              }
            }
          })
    }
  }

  async function handleWeaponResponse(data: any) {
    if (data.hasOwnProperty('conflicts')) {
      if (data.incoming) setIncoming(data.incoming)
      if (data.conflicts) setConflicts(data.conflicts)
      if (data.position) setPosition(data.position)
      setModalOpen(true)
    } else {
      storeGridWeapon(data.grid_weapon)

      // If we replaced an existing weapon, remove it from the grid
      if (data.hasOwnProperty('meta') && data.meta['replaced'] !== undefined) {
        const position = data.meta['replaced']

        if (position == -1) {
          appState.grid.weapons.mainWeapon = undefined
          appState.party.element = 0
        } else {
          appState.grid.weapons.allWeapons[position] = undefined
        }
      }
    }
  }

  async function saveWeapon(partyId: string, weapon: Weapon, position: number) {
    let uncapLevel = 3
    if (weapon.uncap.ulb) uncapLevel = 5
    else if (weapon.uncap.flb) uncapLevel = 4

    return await api.endpoints.weapons.create({
      weapon: {
        party_id: partyId,
        weapon_id: weapon.id,
        position: position,
        mainhand: position == -1,
        uncap_level: uncapLevel,
      },
    })
  }

  function storeGridWeapon(gridWeapon: GridWeapon) {
    if (gridWeapon.position == -1) {
      appState.grid.weapons.mainWeapon = gridWeapon
      appState.party.element = gridWeapon.object.element
    } else {
      // Store the grid unit at the correct position
      appState.grid.weapons.allWeapons[gridWeapon.position] = gridWeapon
    }
  }

  async function resolveConflict() {
    if (incoming && conflicts.length > 0) {
      await api
        .resolveConflict({
          object: 'weapons',
          incoming: incoming.id,
          conflicting: conflicts.map((c) => c.id),
          position: position,
        })
        .then((response) => {
          // Store new character in state
          storeGridWeapon(response.data)

          // Remove conflicting characters from state
          conflicts.forEach((c) => {
            if (appState.grid.weapons.mainWeapon?.object.id === c.id) {
              appState.grid.weapons.mainWeapon = undefined
              appState.party.element = 0
            } else {
              appState.grid.weapons.allWeapons[c.position] = undefined
            }
          })

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

  // Methods: Updating uncap level
  // Note: Saves, but debouncing is not working properly
  async function saveUncap(id: string, position: number, uncapLevel: number) {
    storePreviousUncapValue(position)

    try {
      if (uncapLevel != previousUncapValues[position])
        await api.updateUncap('weapon', id, uncapLevel).then((response) => {
          storeGridWeapon(response.data.grid_weapon)
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
    if (
      party.user &&
      accountState.account.user &&
      party.user.id === accountState.account.user.id
    ) {
      memoizeAction(id, position, uncapLevel)

      // Optimistically update UI
      updateUncapLevel(position, uncapLevel)
    }
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

  const updateUncapLevel = (position: number, uncapLevel: number) => {
    console.log(`Updating uncap level at position ${position} to ${uncapLevel}`)
    if (appState.grid.weapons.mainWeapon && position == -1)
      appState.grid.weapons.mainWeapon.uncap_level = uncapLevel
    else {
      const weapon = appState.grid.weapons.allWeapons[position]
      if (weapon) {
        weapon.uncap_level = uncapLevel
        appState.grid.weapons.allWeapons[position] = weapon
      }
    }
  }

  function storePreviousUncapValue(position: number) {
    // Save the current value in case of an unexpected result
    let newPreviousValues = { ...previousUncapValues }

    if (appState.grid.weapons.mainWeapon && position == -1) {
      newPreviousValues[position] = appState.grid.weapons.mainWeapon.uncap_level
    } else {
      const weapon = appState.grid.weapons.allWeapons[position]
      if (weapon) {
        newPreviousValues[position] = weapon.uncap_level
      } else {
        newPreviousValues[position] = 0
      }
    }

    setPreviousUncapValues(newPreviousValues)
  }

  // Render: JSX components
  const mainhandElement = (
    <WeaponUnit
      gridWeapon={appState.grid.weapons.mainWeapon}
      editable={party.editable}
      key="grid_mainhand"
      position={-1}
      unitType={0}
      updateObject={receiveWeaponFromSearch}
      updateUncap={initiateUncapUpdate}
    />
  )

  const weaponGridElement = Array.from(Array(numWeapons)).map((x, i) => {
    return (
      <li key={`grid_unit_${i}`}>
        <WeaponUnit
          gridWeapon={appState.grid.weapons.allWeapons[i]}
          editable={party.editable}
          position={i}
          unitType={1}
          updateObject={receiveWeaponFromSearch}
          updateUncap={initiateUncapUpdate}
        />
      </li>
    )
  })

  const extraGridElement = (
    <ExtraWeapons
      grid={appState.grid.weapons.allWeapons}
      editable={party.editable}
      offset={numWeapons}
      updateObject={receiveWeaponFromSearch}
      updateUncap={initiateUncapUpdate}
    />
  )

  const conflictModal = () => {
    return incoming && conflicts ? (
      <WeaponConflictModal
        open={modalOpen}
        incomingWeapon={incoming}
        conflictingWeapons={conflicts}
        desiredPosition={position}
        resolveConflict={resolveConflict}
        resetConflict={resetConflict}
      />
    ) : (
      ''
    )
  }

  const incompatibleAlert = () => {
    return showIncompatibleAlert ? (
      <Alert
        open={showIncompatibleAlert}
        cancelAction={() => setShowIncompatibleAlert(!showIncompatibleAlert)}
        cancelActionText={t('buttons.confirm')}
        message={t('alert.incompatible_weapon')}
      ></Alert>
    ) : (
      ''
    )
  }

  return (
    <div id="WeaponGrid">
      {conflicts ? conflictModal() : ''}
      {incompatibleAlert()}
      <div id="MainGrid">
        {mainhandElement}
        <ul className="Weapons">{weaponGridElement}</ul>
      </div>

      {(() => {
        return party.extra ? extraGridElement : ''
      })()}
    </div>
  )
}

export default WeaponGrid
