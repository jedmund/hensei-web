/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

import { AxiosError, AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import Alert from '~components/common/Alert'
import JobSection from '~components/job/JobSection'
import CharacterUnit from '~components/character/CharacterUnit'
import CharacterConflictModal from '~components/character/CharacterConflictModal'

import type { DetailsObject, JobSkillObject, SearchableObject } from '~types'

import api from '~utils/api'
import { appState } from '~utils/appState'
import * as CharacterTransformer from '~transformers/CharacterTransformer'
import * as GridCharacterTransformer from '~transformers/GridCharacterTransformer'

import styles from './index.module.scss'
import { use } from 'i18next'

// Props
interface Props {
  new: boolean
  editable: boolean
  characters?: GridArray<GridCharacter>
  createParty: (details?: DetailsObject) => Promise<Party>
  pushHistory?: (path: string) => void
}

const CharacterGrid = (props: Props) => {
  // Constants
  const numCharacters: number = 5

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

  // Set up state for view management
  const { party } = useSnapshot(appState)
  const [modalOpen, setModalOpen] = useState(false)

  // Set up state for conflict management
  const [incoming, setIncoming] = useState<Character>()
  const [conflicts, setConflicts] = useState<GridCharacter[]>([])
  const [position, setPosition] = useState(0)

  // Set up state for data
  const [job, setJob] = useState<Job | undefined>()
  const [jobSkills, setJobSkills] = useState<JobSkillObject>({
    0: undefined,
    1: undefined,
    2: undefined,
    3: undefined,
  })
  const [jobAccessory, setJobAccessory] = useState<JobAccessory>()
  const [errorMessage, setErrorMessage] = useState('')

  // Create a temporary state to store previous weapon uncap values and transcendence stages
  const [previousUncapValues, setPreviousUncapValues] = useState<{
    [key: number]: number | undefined
  }>({})

  const [previousTranscendenceStages, setPreviousTranscendenceStages] =
    useState<{
      [key: number]: number | undefined
    }>({})

  useEffect(() => {
    console.log('loading chara grid')
  }, [])

  useEffect(() => {
    setJob(appState.party.protagonist.job)
    setJobSkills(
      appState.party.protagonist.skills
        ? appState.party.protagonist.skills
        : {
            0: undefined,
            1: undefined,
            2: undefined,
            3: undefined,
          }
    )
    setJobAccessory(
      appState.party.protagonist.accessory
        ? appState.party.protagonist.accessory
        : undefined
    )
  }, [])

  // Initialize an array of current uncap values for each characters
  useEffect(() => {
    let initialPreviousUncapValues: { [key: number]: number } = {}
    const values = appState.party.grid.characters
      ? appState.party.grid.characters
      : {}
    Object.values(values).map((o) => {
      o ? (initialPreviousUncapValues[o.position] = o.uncapLevel) : 0
    })
    setPreviousUncapValues(initialPreviousUncapValues)
  }, [appState.party.grid.characters])

  // Methods: Adding an object from search
  function receiveCharacterFromSearch(
    object: SearchableObject,
    position: number
  ) {
    const character = object as Character

    if (!party.id) {
      props.createParty().then((team) => {
        saveCharacter(team.id, character, position)
          .then((response) => storeGridCharacter(response.data))
          .catch((error) => console.error(error))
      })
    } else {
      if (props.editable)
        saveCharacter(party.id, character, position)
          .then((response) => handleCharacterResponse(response.data))
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

  async function handleCharacterResponse(data: any) {
    if (data.hasOwnProperty('conflicts')) {
      setIncoming(CharacterTransformer.toObject(data.incoming))
      setConflicts(
        data.conflicts.map((c: any) => GridCharacterTransformer.toObject(c))
      )
      setPosition(data.position)
      setModalOpen(true)
    } else {
      storeGridCharacter(data)
    }
  }

  async function saveCharacter(
    partyId: string,
    character: Character,
    position: number
  ) {
    return await api.endpoints.characters.create({
      character: {
        party_id: partyId,
        character_id: character.id,
        position: position,
        uncapLevel: characterUncapLevel(character),
      },
    })
  }

  function storeGridCharacter(data: any) {
    const gridCharacter = GridCharacterTransformer.toObject(data)

    appState.party.grid.characters = {
      ...appState.party.grid.characters,
      [gridCharacter.position]: gridCharacter,
    }
  }

  async function resolveConflict() {
    if (incoming && conflicts.length > 0) {
      await api
        .resolveConflict({
          object: 'characters',
          incoming: incoming.id,
          conflicting: conflicts.map((c) => c.id),
          position: position,
        })
        .then((response) => {
          // Store new character in state
          storeGridCharacter(response.data)

          // Remove conflicting characters from state
          conflicts.forEach(
            (c) =>
              (appState.party.grid.characters = {
                ...appState.party.grid.characters,
                [c.position]: null,
              })
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
    setModalOpen(false)
  }

  async function removeCharacter(id: string) {
    try {
      const response = await api.endpoints.grid_characters.destroy({ id: id })
      appState.party.grid.characters = {
        ...appState.party.grid.characters,
        [response.data.position]: null,
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Methods: Saving job and job skills
  async function saveJob(job?: Job) {
    const payload = {
      party: {
        job_id: job ? job.id : -1,
      },
    }

    if (!party.id) {
      // If the party has no ID, create a new party
      await props.createParty()
    }

    if (appState.party.id) {
      const response = await api.updateJob({
        partyId: appState.party.id,
        params: payload,
      })

      const team = response.data

      setJob(team.job)
      appState.party.protagonist.job = team.job

      setJobSkills(team.job_skills)
      appState.party.protagonist.skills = team.job_skills
    }
  }

  function saveJobSkill(skill: JobSkill, position: number) {
    if (party.id && props.editable) {
      const positionedKey = `skill${position}_id`

      let skillObject: {
        [key: string]: string | undefined
        skill0_id?: string
        skill1_id?: string
        skill2_id?: string
        skill3_id?: string
      } = {}

      const payload = {
        party: skillObject,
      }

      skillObject[positionedKey] = skill.id
      api
        .updateJobSkills({ partyId: party.id, params: payload })
        .then((response) => {
          // Update the current skills
          const newSkills = response.data.job_skills
          setJobSkills(newSkills)
          appState.party.protagonist.skills = newSkills
        })
        .catch((error) => {
          const data = error.response.data
          if (data.code == 'too_many_skills_of_type') {
            const message = `You can only add up to 2 ${
              data.skill_type === 'emp'
                ? data.skill_type.toUpperCase()
                : data.skill_type
            } skills to your party at once.`
            setErrorMessage(message)
          }
        })
    }
  }

  function removeJobSkill(position: number) {
    if (party.id && props.editable) {
      api
        .removeJobSkill({ partyId: party.id, position: position })
        .then((response) => {
          // Update the current skills
          const newSkills = response.data.job_skills
          setJobSkills(newSkills)
          appState.party.protagonist.skills = newSkills
        })
        .catch((error) => {
          const data = error.response.data
          console.log(data)
        })
    }
  }

  async function saveAccessory(accessory: JobAccessory) {
    const payload = {
      party: {
        accessory_id: accessory.id,
      },
    }

    if (appState.party.id) {
      const response = await api.endpoints.parties.update(
        appState.party.id,
        payload
      )
      const team = response.data.party
      setJobAccessory(team.accessory)
      appState.party.protagonist.accessory = team.accessory
    }
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
    storePreviousTranscendenceStage(position)

    try {
      if (uncapLevel != previousUncapValues[position])
        await api.updateUncap('character', id, uncapLevel).then((response) => {
          storeGridCharacter(response.data)
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

  const updateUncapLevel = (
    position: number,
    uncapLevel: number | undefined
  ) => {
    const character = appState.party.grid.characters?.[position]
    if (character && uncapLevel) {
      character.uncapLevel = uncapLevel
      appState.party.grid.characters = {
        ...appState.party.grid.characters,
        [position]: character,
      }
    }
  }

  function storePreviousUncapValue(position: number) {
    // Save the current value in case of an unexpected result
    let newPreviousValues = { ...previousUncapValues }

    if (party.grid.characters && party.grid.characters[position]) {
      newPreviousValues[position] = party.grid.characters[position]?.uncapLevel
      setPreviousUncapValues(newPreviousValues)
    }
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
      character: {
        uncapLevel: stage > 0 ? 6 : 5,
        transcendence_step: stage,
      },
    }

    try {
      if (stage != previousTranscendenceStages[position])
        await api.endpoints.grid_characters
          .update(id, payload)
          .then((response) => {
            storeGridCharacter(response.data)
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

  const updateTranscendenceStage = (
    position: number,
    stage: number | undefined
  ) => {
    const character = appState.party.grid.characters?.[position]
    if (character && stage !== undefined) {
      character.transcendenceStep = stage
      appState.party.grid.characters = {
        ...appState.party.grid.characters,
        [position]: character,
      }
    }
  }

  function storePreviousTranscendenceStage(position: number) {
    // Save the current value in case of an unexpected result
    let newPreviousValues = { ...previousUncapValues }

    if (party.grid.characters && party.grid.characters[position]) {
      newPreviousValues[position] = party.grid.characters[position]?.uncapLevel
      setPreviousTranscendenceStages(newPreviousValues)
    }
  }

  function cancelAlert() {
    setErrorMessage('')
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

  return (
    <div>
      <Alert
        open={errorMessage.length > 0}
        message={errorMessage}
        cancelAction={cancelAlert}
        cancelActionText={'Got it'}
      />
      <div className={styles.grid}>
        <JobSection
          job={job}
          jobSkills={jobSkills}
          jobAccessory={jobAccessory}
          editable={props.editable}
          saveJob={saveJob}
          saveSkill={saveJobSkill}
          removeSkill={removeJobSkill}
          saveAccessory={saveAccessory}
        />
        <CharacterConflictModal
          open={modalOpen}
          incomingCharacter={incoming}
          conflictingCharacters={conflicts}
          desiredPosition={position}
          resolveConflict={resolveConflict}
          resetConflict={resetConflict}
        />
        <ul className={styles.characters}>
          {Array.from(Array(numCharacters)).map((x, i) => {
            return (
              <li key={`grid_unit_${i}`}>
                <CharacterUnit
                  gridCharacter={
                    party.grid.characters ? party.grid.characters[i] : null
                  }
                  editable={props.editable}
                  position={i}
                  updateObject={receiveCharacterFromSearch}
                  updateUncap={initiateUncapUpdate}
                  updateTranscendence={initiateTranscendenceUpdate}
                  removeCharacter={removeCharacter}
                />
              </li>
            )
          })}
        </ul>
      </div>
      {errorAlert()}
    </div>
  )
}

export default CharacterGrid
