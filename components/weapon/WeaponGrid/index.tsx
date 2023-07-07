/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

import { AxiosError, AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'
import classNames from 'classnames'

import Alert from '~components/common/Alert'
import WeaponUnit from '~components/weapon/WeaponUnit'
import ExtraWeaponsGrid from '~components/extra/ExtraWeaponsGrid'
import ExtraContainer from '~components/extra/ExtraContainer'
import ExtraContainerItem from '~components/extra/ExtraContainerItem'
import GuidebooksGrid from '~components/extra/GuidebooksGrid'
import WeaponConflictModal from '~components/weapon/WeaponConflictModal'

import api from '~utils/api'
import { appState } from '~utils/appState'
import * as GridWeaponTransformer from '~transformers/GridWeaponTransformer'

import type { DetailsObject, SearchableObject } from '~types'

import styles from './index.module.scss'
import { ElementMap } from '~utils/elements'

// Props
interface Props {
  new: boolean
  editable: boolean
  weapons?: {
    mainWeapon?: GridWeapon
    allWeapons: GridArray<GridWeapon>
  }
  guidebooks?: GuidebookList
  createParty: (details: DetailsObject) => Promise<Party>
  pushHistory?: (path: string) => void
  updateExtra: (enabled: boolean) => void
  updateGuidebook: (book: Guidebook | undefined, position: number) => void
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

  // Set up state for error handling
  const [axiosError, setAxiosError] = useState<AxiosResponse>()
  const [errorAlertOpen, setErrorAlertOpen] = useState(false)
  const [showIncompatibleAlert, setShowIncompatibleAlert] = useState(false)

  // Set up state for view management
  const { party } = useSnapshot(appState)
  const [modalOpen, setModalOpen] = useState(false)

  // Set up state for conflict management
  const [incoming, setIncoming] = useState<Weapon>()
  const [conflicts, setConflicts] = useState<GridWeapon[]>([])
  const [position, setPosition] = useState(0)

  // Create a temporary state to store previous weapon uncap values
  const [previousUncapValues, setPreviousUncapValues] = useState<{
    [key: number]: number
  }>({})

  // Initialize an array of current uncap values for each weapon
  useEffect(() => {
    let initialPreviousUncapValues: { [key: number]: number } = {}

    if (appState.party.grid.weapons.mainWeapon)
      initialPreviousUncapValues[-1] =
        appState.party.grid.weapons.mainWeapon.uncapLevel

    Object.values(appState.party.grid.weapons.allWeapons).map((o) =>
      o ? (initialPreviousUncapValues[o.position] = o.uncapLevel) : 0
    )

    setPreviousUncapValues(initialPreviousUncapValues)
  }, [
    appState.party.grid.weapons.mainWeapon,
    appState.party.grid.weapons.allWeapons,
  ])

  // Methods: Adding an object from search
  function receiveWeaponFromSearch(object: SearchableObject, position: number) {
    const weapon = object as Weapon
    if (position == 1) appState.party.element = weapon.element

    if (!party.id) {
      const payload: DetailsObject = { extra: party.details.extra }
      props.createParty(payload).then((team) => {
        saveWeapon(team.id, weapon, position).then((response) => {
          if (response) storeGridWeapon(response.data.grid_weapon)
        })
      })
    } else {
      if (props.editable)
        saveWeapon(party.id, weapon, position)
          .then((response) => {
            if (response) handleWeaponResponse(response.data)
          })
          .catch((error) => {
            const axiosError = error as AxiosError
            const response = axiosError.response

            if (response) {
              const code = response.status
              const data = response.data

              if (
                code === 422 &&
                data.code === 'incompatible_weapon_for_position'
              ) {
                setShowIncompatibleAlert(true)
              } else {
                setErrorAlertOpen(true)
                setAxiosError(response)
              }
            }
          })
    }
  }

  function receiveGuidebookFromSearch(
    object: SearchableObject,
    position: number
  ) {
    props.updateGuidebook(object as Guidebook, position)
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
          appState.party.grid.weapons.mainWeapon = null
          appState.party.element = ElementMap.null
        } else {
          appState.party.grid.weapons.allWeapons[position] = null
        }
      }
    }
  }

  async function saveWeapon(partyId: string, weapon: Weapon, position: number) {
    let uncapLevel = 3
    if (weapon.uncap.ulb) uncapLevel = 5
    else if (weapon.uncap.flb) uncapLevel = 4

    let post = false
    if (
      position === -1 &&
      (!appState.party.grid.weapons.mainWeapon ||
        (appState.party.grid.weapons.mainWeapon &&
          appState.party.grid.weapons.mainWeapon.object.id !== weapon.id))
    ) {
      post = true
    } else if (
      position !== -1 &&
      (!appState.party.grid.weapons.allWeapons[position] ||
        (appState.party.grid.weapons.allWeapons[position] &&
          appState.party.grid.weapons.allWeapons[position]?.object.id !==
            weapon.id))
    ) {
      post = true
    }

    if (post) {
      return await api.endpoints.weapons.create({
        weapon: {
          party_id: partyId,
          weapon_id: weapon.id,
          position: position,
          mainhand: position == -1,
          uncapLevel: uncapLevel,
        },
      })
    }
  }

  function storeGridWeapon(data: GridWeapon) {
    const gridWeapon = GridWeaponTransformer.toObject(data)
    if (gridWeapon.position === -1) {
      appState.party.grid.weapons.mainWeapon = gridWeapon
      appState.party.element = gridWeapon.object.element
    } else {
      // Store the grid unit at the correct position
      appState.party.grid.weapons.allWeapons[gridWeapon.position] = gridWeapon
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
          // Remove conflicting characters from state
          conflicts.forEach((c) => {
            if (
              appState.party.grid.weapons.mainWeapon?.object.id === c.object.id
            ) {
              appState.party.grid.weapons.mainWeapon = null
              appState.party.element = ElementMap.null
            } else {
              appState.party.grid.weapons.allWeapons[c.position] = null
            }
          })

          // Store new character in state
          storeGridWeapon(response.data.grid_weapon)

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

  async function removeWeapon(id: string) {
    try {
      const response = await api.endpoints.grid_weapons.destroy({ id: id })
      const data = response.data

      if (data.position === -1) {
        appState.party.grid.weapons.mainWeapon = null
      } else {
        appState.party.grid.weapons.allWeapons[response.data.position] = null
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function removeGuidebook(position: number) {
    props.updateGuidebook(undefined, position)
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
    if (props.editable) {
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
    // console.log(`Updating uncap level at position ${position} to ${uncapLevel}`)
    if (appState.party.grid.weapons.mainWeapon && position == -1)
      appState.party.grid.weapons.mainWeapon.uncapLevel = uncapLevel
    else {
      const weapon = appState.party.grid.weapons.allWeapons[position]
      if (weapon) {
        weapon.uncapLevel = uncapLevel
        appState.party.grid.weapons.allWeapons[position] = weapon
      }
    }
  }

  function storePreviousUncapValue(position: number) {
    // Save the current value in case of an unexpected result
    let newPreviousValues = { ...previousUncapValues }

    if (appState.party.grid.weapons.mainWeapon && position == -1) {
      newPreviousValues[position] =
        appState.party.grid.weapons.mainWeapon.uncapLevel
    } else {
      const weapon = appState.party.grid.weapons.allWeapons[position]
      if (weapon) {
        newPreviousValues[position] = weapon.uncapLevel
      } else {
        newPreviousValues[position] = 0
      }
    }

    setPreviousUncapValues(newPreviousValues)
  }

  // Methods: Convenience
  const displayExtraContainer =
    props.editable ||
    appState.party.details.extra ||
    Object.values(appState.party.guidebooks).every((el) => el === undefined)

  // Render: JSX components
  const mainhandElement = (
    <WeaponUnit
      gridWeapon={appState.party.grid.weapons.mainWeapon}
      editable={props.editable}
      key="grid_mainhand"
      position={-1}
      unitType={0}
      removeWeapon={removeWeapon}
      updateObject={receiveWeaponFromSearch}
      updateUncap={initiateUncapUpdate}
    />
  )

  const weaponGridElement = Array.from(Array(numWeapons)).map((x, i) => {
    const itemClasses = classNames({
      Empty: appState.party.grid.weapons.allWeapons[i] === undefined,
    })

    return (
      <li className={itemClasses} key={`grid_unit_${i}`}>
        <WeaponUnit
          gridWeapon={party.grid.weapons.allWeapons[i]}
          editable={props.editable}
          position={i}
          unitType={1}
          removeWeapon={removeWeapon}
          updateObject={receiveWeaponFromSearch}
          updateUncap={initiateUncapUpdate}
        />
      </li>
    )
  })

  const extraElement = () => {
    if (appState.party.raid && appState.party.raid.group?.extra) {
      return (
        <ExtraContainer>
          <ExtraContainerItem title={t('extra_weapons')} className="weapons">
            {appState.party.raid && appState.party.raid.group.extra && (
              <ExtraWeaponsGrid
                grid={appState.party.grid.weapons.allWeapons}
                editable={props.editable}
                offset={numWeapons}
                removeWeapon={removeWeapon}
                updateObject={receiveWeaponFromSearch}
                updateUncap={initiateUncapUpdate}
              />
            )}
          </ExtraContainerItem>
          {appState.party.raid && appState.party.raid.group.guidebooks && (
            <ExtraContainerItem
              title={t('sephira_guidebooks')}
              className="guidebooks"
            >
              <GuidebooksGrid
                grid={appState.party.guidebooks}
                editable={props.editable}
                removeGuidebook={removeGuidebook}
                updateObject={receiveGuidebookFromSearch}
              />
            </ExtraContainerItem>
          )}
        </ExtraContainer>
      )
    }
  }

  const conflictModal = () => {
    return (
      incoming &&
      conflicts && (
        <WeaponConflictModal
          open={modalOpen}
          incomingWeapon={incoming}
          conflictingWeapons={conflicts}
          desiredPosition={position}
          resolveConflict={resolveConflict}
          resetConflict={resetConflict}
        />
      )
    )
  }

  const incompatibleAlert = () => {
    return (
      showIncompatibleAlert && (
        <Alert
          open={showIncompatibleAlert}
          cancelAction={() => setShowIncompatibleAlert(!showIncompatibleAlert)}
          cancelActionText={t('buttons.confirm')}
          message={t('alert.incompatible_weapon')}
        />
      )
    )
  }

  const errorAlert = () => {
    return (
      <Alert
        open={errorAlertOpen}
        title={axiosError ? `${axiosError.status}` : 'Error'}
        message={t(`errors.${axiosError?.statusText.toLowerCase()}`)}
        cancelAction={() => setErrorAlertOpen(false)}
        cancelActionText={t('buttons.confirm')}
      />
    )
  }

  return (
    <div className={styles.wrapper}>
      {conflicts ? conflictModal() : ''}
      {incompatibleAlert()}
      {errorAlert()}
      <div className={styles.grid}>
        {mainhandElement}
        <ul className={styles.weapons}>{weaponGridElement}</ul>
      </div>

      {displayExtraContainer ? extraElement() : ''}
    </div>
  )
}

export default WeaponGrid
