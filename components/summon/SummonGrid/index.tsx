/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import { AxiosError, AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import Alert from '~components/common/Alert'
import SummonUnit from '~components/summon/SummonUnit'
import ExtraSummonsGrid from '~components/extra/ExtraSummonsGrid'

import api from '~utils/api'
import { appState } from '~utils/appState'
import type { DetailsObject, SearchableObject } from '~types'

import styles from './index.module.scss'

// Props
interface Props {
  new: boolean
  editable: boolean
  summons?: GridSummon[]
  createParty: (details?: DetailsObject) => Promise<Party>
  pushHistory?: (path: string) => void
}

const SummonGrid = (props: Props) => {
  // Constants
  const numSummons: number = 4

  // Cookies
  const cookie = getCookie('account')
  const accountData: AccountCookie = cookie
    ? JSON.parse(cookie as string)
    : null

  // Localization
  const { t } = useTranslation('common')

  // Set up state for error handling
  const [axiosError, setAxiosError] = useState<AxiosResponse>()
  const [errorAlertOpen, setErrorAlertOpen] = useState(false)

  // Set up state for view management
  const { party, grid } = useSnapshot(appState)

  // Create a temporary state to store previous weapon uncap values and transcendence stages
  const [previousUncapValues, setPreviousUncapValues] = useState<{
    [key: number]: number
  }>({})
  const [previousTranscendenceStages, setPreviousTranscendenceStages] =
    useState<{
      [key: number]: number
    }>({})

  // Initialize an array of current uncap values for each summon
  useEffect(() => {
    let initialPreviousUncapValues: { [key: number]: number } = {}

    if (appState.grid.summons.mainSummon)
      initialPreviousUncapValues[-1] =
        appState.grid.summons.mainSummon.uncap_level

    if (appState.grid.summons.friendSummon)
      initialPreviousUncapValues[6] =
        appState.grid.summons.friendSummon.uncap_level

    Object.values(appState.grid.summons.allSummons).map((o) =>
      o ? (initialPreviousUncapValues[o.position] = o.uncap_level) : 0
    )

    setPreviousUncapValues(initialPreviousUncapValues)
  }, [
    appState.grid.summons.mainSummon,
    appState.grid.summons.friendSummon,
    appState.grid.summons.allSummons,
  ])

  // Methods: Adding an object from search
  function receiveSummonFromSearch(object: SearchableObject, position: number) {
    const summon = object as Summon

    if (!party.id) {
      props.createParty().then((team) => {
        saveSummon(team.id, summon, position).then((response) =>
          storeGridSummon(response.data)
        )
      })
    } else {
      if (props.editable)
        saveSummon(party.id, summon, position)
          .then((response) => handleSummonResponse(response.data))
          .catch((error) => {
            const axiosError = error as AxiosError
            const response = axiosError.response

            if (response) {
              setErrorAlertOpen(true)
              setAxiosError(response)
            }
          })
    }
  }

  async function handleSummonResponse(data: any) {
    if (data.hasOwnProperty('errors')) {
    } else {
      storeGridSummon(data.grid_summon)

      // If we replaced an existing weapon, remove it from the grid
      if (data.hasOwnProperty('meta') && data.meta['replaced'] !== undefined) {
        const position = data.meta['replaced']

        if (position == -1) {
          appState.grid.summons.mainSummon = undefined
        } else if (position == 6) {
          appState.grid.summons.friendSummon = undefined
        } else {
          appState.grid.summons.allSummons[position] = undefined
        }
      }
    }
  }

  async function saveSummon(partyId: string, summon: Summon, position: number) {
    let uncapLevel = 3
    if (summon.uncap.ulb) uncapLevel = 5
    else if (summon.uncap.flb) uncapLevel = 4

    return await api.endpoints.summons.create({
      summon: {
        party_id: partyId,
        summon_id: summon.id,
        position: position,
        main: position == -1,
        friend: position == 6,
        uncap_level: uncapLevel,
      },
    })
  }

  function storeGridSummon(gridSummon: GridSummon) {
    if (gridSummon.position == -1) appState.grid.summons.mainSummon = gridSummon
    else if (gridSummon.position == 6)
      appState.grid.summons.friendSummon = gridSummon
    else appState.grid.summons.allSummons[gridSummon.position] = gridSummon
  }

  // Methods: Updating uncap level
  // Note: Saves, but debouncing is not working properly
  async function saveUncap(id: string, position: number, uncapLevel: number) {
    storePreviousUncapValue(position)
    storePreviousTranscendenceStage(position)

    try {
      if (uncapLevel != previousUncapValues[position])
        await api.updateUncap('summon', id, uncapLevel).then((response) => {
          storeGridSummon(response.data.grid_summon)
        })
    } catch (error) {
      console.error(error)

      // Revert optimistic UI
      updateUncapLevel(position, previousUncapValues[position])
      updateTranscendenceStage(position, previousTranscendenceStages[position])

      // Remove optimistic key
      let newPreviousTranscendenceStages = { ...previousTranscendenceStages }
      let newPreviousUncapValues = { ...previousUncapValues }

      delete newPreviousTranscendenceStages[position]
      delete newPreviousUncapValues[position]

      setPreviousTranscendenceStages(newPreviousTranscendenceStages)
      setPreviousUncapValues(newPreviousUncapValues)
    }
  }

  function initiateUncapUpdate(
    id: string,
    position: number,
    uncapLevel: number
  ) {
    if (props.editable) {
      memoizeUncapAction(id, position, uncapLevel)

      // Optimistically update UI
      updateUncapLevel(position, uncapLevel)

      if (uncapLevel < 6) {
        updateTranscendenceStage(position, 0)
      }
    }
  }

  const memoizeUncapAction = useCallback(
    (id: string, position: number, uncapLevel: number) => {
      debouncedUncapAction(id, position, uncapLevel)
    },
    [props, previousUncapValues]
  )

  const debouncedUncapAction = useMemo(
    () =>
      debounce((id, position, number) => {
        saveUncap(id, position, number)
      }, 500),
    [props, saveUncap]
  )

  const updateUncapLevel = (position: number, uncapLevel: number) => {
    if (appState.grid.summons.mainSummon && position == -1)
      appState.grid.summons.mainSummon.uncap_level = uncapLevel
    else if (appState.grid.summons.friendSummon && position == 6)
      appState.grid.summons.friendSummon.uncap_level = uncapLevel
    else {
      const summon = appState.grid.summons.allSummons[position]
      if (summon) {
        summon.uncap_level = uncapLevel
        appState.grid.summons.allSummons[position] = summon
      }
    }
  }

  function storePreviousUncapValue(position: number) {
    // Save the current value in case of an unexpected result
    let newPreviousValues = { ...previousUncapValues }

    if (appState.grid.summons.mainSummon && position == -1)
      newPreviousValues[position] = appState.grid.summons.mainSummon.uncap_level
    else if (appState.grid.summons.friendSummon && position == 6)
      newPreviousValues[position] =
        appState.grid.summons.friendSummon.uncap_level
    else {
      const summon = appState.grid.summons.allSummons[position]
      newPreviousValues[position] = summon ? summon.uncap_level : 0
    }

    setPreviousUncapValues(newPreviousValues)
  }

  // Methods: Updating transcendence stage
  // Note: Saves, but debouncing is not working properly
  async function saveTranscendence(
    id: string,
    position: number,
    stage: number
  ) {
    storePreviousUncapValue(position)
    storePreviousTranscendenceStage(position)

    const payload = {
      summon: {
        uncap_level: stage > 0 ? 6 : 5,
        transcendence_step: stage,
      },
    }

    try {
      if (stage != previousTranscendenceStages[position])
        await api.endpoints.grid_summons
          .update(id, payload)
          .then((response) => {
            storeGridSummon(response.data.grid_summon)
          })
    } catch (error) {
      console.error(error)

      // Revert optimistic UI
      updateUncapLevel(position, previousUncapValues[position])
      updateTranscendenceStage(position, previousTranscendenceStages[position])

      // Remove optimistic key
      let newPreviousTranscendenceStages = { ...previousTranscendenceStages }
      let newPreviousUncapValues = { ...previousUncapValues }

      delete newPreviousTranscendenceStages[position]
      delete newPreviousUncapValues[position]

      setPreviousTranscendenceStages(newPreviousTranscendenceStages)
      setPreviousUncapValues(newPreviousUncapValues)
    }
  }

  function initiateTranscendenceUpdate(
    id: string,
    position: number,
    stage: number
  ) {
    if (props.editable) {
      memoizeTranscendenceAction(id, position, stage)

      // Optimistically update UI
      updateTranscendenceStage(position, stage)

      if (stage > 0) {
        updateUncapLevel(position, 6)
      }
    }
  }

  const memoizeTranscendenceAction = useCallback(
    (id: string, position: number, stage: number) => {
      debouncedTranscendenceAction(id, position, stage)
    },
    [props, previousTranscendenceStages]
  )

  const debouncedTranscendenceAction = useMemo(
    () =>
      debounce((id, position, number) => {
        saveTranscendence(id, position, number)
      }, 500),
    [props, saveTranscendence]
  )

  const updateTranscendenceStage = (position: number, stage: number) => {
    if (appState.grid.summons.mainSummon && position == -1)
      appState.grid.summons.mainSummon.transcendence_step = stage
    else if (appState.grid.summons.friendSummon && position == 6)
      appState.grid.summons.friendSummon.transcendence_step = stage
    else {
      const summon = appState.grid.summons.allSummons[position]
      if (summon) {
        summon.transcendence_step = stage
        appState.grid.summons.allSummons[position] = summon
      }
    }
  }

  function storePreviousTranscendenceStage(position: number) {
    // Save the current value in case of an unexpected result
    let newPreviousValues = { ...previousUncapValues }

    if (appState.grid.summons.mainSummon && position == -1)
      newPreviousValues[position] = appState.grid.summons.mainSummon.uncap_level
    else if (appState.grid.summons.friendSummon && position == 6)
      newPreviousValues[position] =
        appState.grid.summons.friendSummon.uncap_level
    else {
      const summon = appState.grid.summons.allSummons[position]
      newPreviousValues[position] = summon ? summon.uncap_level : 0
    }

    setPreviousUncapValues(newPreviousValues)
  }

  async function removeSummon(id: string) {
    try {
      const response = await api.endpoints.grid_summons.destroy({ id: id })
      const data = response.data

      if (data.position === -1) {
        appState.grid.summons.mainSummon = undefined
      } else if (data.position === 6) {
        appState.grid.summons.friendSummon = undefined
      } else {
        appState.grid.summons.allSummons[response.data.position] = undefined
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Render: JSX components
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

  const mainSummonElement = (
    <div className="LabeledUnit">
      <div className={styles.label}>{t('summons.main')}</div>
      <SummonUnit
        gridSummon={grid.summons.mainSummon}
        editable={props.editable}
        key="grid_main_summon"
        position={-1}
        unitType={0}
        removeSummon={removeSummon}
        updateObject={receiveSummonFromSearch}
        updateUncap={initiateUncapUpdate}
        updateTranscendence={initiateTranscendenceUpdate}
      />
    </div>
  )

  const friendSummonElement = (
    <div className="LabeledUnit">
      <div
        className={classNames({
          [styles.label]: true,
          [styles.friend]: true,
        })}
      >
        {t('summons.friend')}
      </div>
      <SummonUnit
        gridSummon={grid.summons.friendSummon}
        editable={props.editable}
        key="grid_friend_summon"
        position={6}
        unitType={2}
        removeSummon={removeSummon}
        updateObject={receiveSummonFromSearch}
        updateUncap={initiateUncapUpdate}
        updateTranscendence={initiateTranscendenceUpdate}
      />
    </div>
  )

  const summonGridElement = (
    <section>
      <div className={styles.label}>{t('summons.summons')}</div>
      <ul className={styles.summons}>
        {Array.from(Array(numSummons)).map((x, i) => {
          return (
            <li key={`grid_unit_${i}`}>
              <SummonUnit
                gridSummon={grid.summons.allSummons[i]}
                editable={props.editable}
                position={i}
                unitType={1}
                removeSummon={removeSummon}
                updateObject={receiveSummonFromSearch}
                updateUncap={initiateUncapUpdate}
                updateTranscendence={initiateTranscendenceUpdate}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )

  const subAuraSummonElement = (
    <ExtraSummonsGrid
      grid={grid.summons.allSummons}
      editable={props.editable}
      exists={false}
      offset={numSummons}
      removeSummon={removeSummon}
      updateObject={receiveSummonFromSearch}
      updateUncap={initiateUncapUpdate}
      updateTranscendence={initiateTranscendenceUpdate}
    />
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {mainSummonElement}
        {summonGridElement}
        {friendSummonElement}
      </div>

      {subAuraSummonElement}
      {errorAlert()}
    </div>
  )
}

export default SummonGrid
