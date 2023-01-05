// Core dependencies
import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { AxiosResponse } from 'axios'

// UI dependencies
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '~components/Dialog'
import Button from '~components/Button'
import AwakeningSelect from '~components/AwakeningSelect'

// Utilities
import api from '~utils/api'
import { appState } from '~utils/appState'
import { retrieveCookies } from '~utils/retrieveCookies'

// Styles and icons
import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

// Types
interface GridCharacterObject {
  character: {
    ring_modifier1: number
    ring_modifier2: number
    ring_modifier3: number
    ring_modifier4: number
    ring_strength1: number
    ring_strength2: number
    ring_strength3: number
    ring_strength4: number
    awakening_type: number
    awakening_level: number
    transcendence_step: number
  }
}

interface Props {
  gridCharacter: GridCharacter
  children: React.ReactNode
}

const CharacterModal = ({ gridCharacter, children }: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

  // Cookies
  const cookies = retrieveCookies()

  // UI state
  const [open, setOpen] = useState(false)
  const [formValid, setFormValid] = useState(false)

  const [ring1Open, setRing1Open] = useState(false)
  const [ring2Open, setRing2Open] = useState(false)
  const [ring3Open, setRing3Open] = useState(false)
  const [ring4Open, setRing4Open] = useState(false)
  const [earringOpen, setEarringOpen] = useState(false)
  const [awakeningOpen, setAwakeningOpen] = useState(false)

  // Character properties: Ring
  const [ringModifier1, setRingModifier1] = useState(0)
  const [ringModifier2, setRingModifier2] = useState(0)
  const [ringModifier3, setRingModifier3] = useState(0)
  const [ringModifier4, setRingModifier4] = useState(0)

  const [ringStrength1, setRingStrength1] = useState(0)
  const [ringStrength2, setRingStrength2] = useState(0)
  const [ringStrength3, setRingStrength3] = useState(0)
  const [ringStrength4, setRingStrength4] = useState(0)

  // Character properties: Earrings
  const [earringModifier, setEarringModifier] = useState(0)
  const [earringStrength, setEarringStrength] = useState(0)

  // Character properties: Awakening
  const [awakeningType, setAwakeningType] = useState(0)
  const [awakeningLevel, setAwakeningLevel] = useState(0)

  // Character properties: Transcendence
  const [transcendenceStep, setTranscendenceStep] = useState(0)

  // Hooks
  useEffect(() => {}, [])

  // Methods: UI state management
  function openChange(open: boolean) {
    setOpen(open)
  }

  function openSelect(
    name: 'ring1' | 'ring2' | 'ring3' | 'ring4' | 'earring' | 'awakening'
  ) {
    setRing1Open(name === 'ring1' ? !ring1Open : false)
    setRing2Open(name === 'ring2' ? !ring2Open : false)
    setRing3Open(name === 'ring3' ? !ring3Open : false)
    setRing4Open(name === 'ring4' ? !ring4Open : false)
    setEarringOpen(name === 'earring' ? !earringOpen : false)
    setAwakeningOpen(name === 'awakening' ? !awakeningOpen : false)
  }

  const anySelectOpen =
    ring1Open ||
    ring2Open ||
    ring3Open ||
    ring4Open ||
    earringOpen ||
    awakeningOpen

  function onEscapeKeyDown(event: KeyboardEvent) {
    if (anySelectOpen) {
      return event.preventDefault()
    } else {
      setOpen(false)
    }
  }

  function receiveRingOpen(index: 1 | 2 | 3 | 4, isOpen: boolean) {
    if (index === 1) setRing1Open(isOpen)
    if (index === 2) setRing2Open(isOpen)
    if (index === 3) setRing3Open(isOpen)
    if (index === 4) setRing4Open(isOpen)
  }

  function receiveEarringOpen(isOpen: boolean) {
    setEarringOpen(isOpen)
  }

  function receiveAwakeningOpen(isOpen: boolean) {
    setAwakeningOpen(isOpen)
  }

  // Methods: Receive data from components
  function receiveRingValues(
    ringModifier1: number,
    ringModifier2: number,
    ringModifier3: number,
    ringModifier4: number,
    ringStrength1: number,
    ringStrength2: number,
    ringStrength3: number,
    ringStrength4: number
  ) {
    setRingModifier1(ringModifier1)
    setRingModifier2(ringModifier2)
    setRingModifier3(ringModifier3)
    setRingModifier4(ringModifier4)

    setRingStrength1(ringStrength1)
    setRingStrength2(ringStrength2)
    setRingStrength3(ringStrength3)
    setRingStrength4(ringStrength4)
  }

  function receiveEarringValues(
    earringModifier: number,
    earringStrength: number
  ) {
    setEarringModifier(earringModifier)
    setEarringStrength(earringStrength)
  }

  function receiveAwakeningValues(type: number, level: number) {
    setAwakeningType(type)
    setAwakeningLevel(level)
  }

  function receiveValidity(isValid: boolean) {
    setFormValid(isValid)
  }

  // Methods: Data syncing

  // Prepare the GridWeaponObject to send to the server
  function prepareObject() {
    let object: GridCharacterObject = {
      character: {
        ring_modifier1: ringModifier1,
        ring_modifier2: ringModifier2,
        ring_modifier3: ringModifier3,
        ring_modifier4: ringModifier4,
        ring_strength1: ringStrength1,
        ring_strength2: ringStrength2,
        ring_strength3: ringStrength3,
        ring_strength4: ringStrength4,
        awakening_type: awakeningType,
        awakening_level: awakeningLevel,
        transcendence_step: transcendenceStep,
      },
    }

    return object
  }

  // Send the GridWeaponObject to the server
  async function updateCharacter() {
    const updateObject = prepareObject()
    return await api.endpoints.grid_characters
      .update(gridCharacter.id, updateObject)
      .then((response) => processResult(response))
      .catch((error) => processError(error))
  }

  // Save the server's response to state
  function processResult(response: AxiosResponse) {
    const gridCharacter: GridCharacter = response.data
    appState.grid.characters[gridCharacter.position] = gridCharacter

    setOpen(false)
  }

  function processError(error: any) {
    console.error(error)
  }

  const ringSelect = () => {
    return (
      <section>
        <h3>{t('modals.characters.subtitles.ring')}</h3>
        <RingSelect
          gridCharacter={gridCharacter}
          onOpenChange={receiveRingOpen}
          sendValidity={receiveValidity}
          sendValues={receiveRingValues}
        />
      </section>
    )
  }

  const earringSelect = () => {
    return (
      <section>
        <h3>{t('modals.characters.subtitles.earring')}</h3>
        <EarringSelect
          gridCharacter={gridCharacter}
          onOpenChange={receiveEarringOpen}
          sendValidity={receiveValidity}
          sendValues={receiveEarringValues}
        />
      </section>
    )
  }

  const awakeningSelect = () => {
    return (
      <section>
        <h3>{t('modals.weapon.subtitles.awakening')}</h3>
        <AwakeningSelect
          object="character"
          awakeningType={gridCharacter.awakening?.type}
          awakeningLevel={gridCharacter.awakening?.level}
          onOpenChange={receiveAwakeningOpen}
          sendValidity={receiveValidity}
          sendValues={receiveAwakeningValues}
        />
      </section>
    )
  }

  return (
    // TODO: Refactor into Dialog component
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="Character Dialog"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={onEscapeKeyDown}
      >
        <div className="DialogHeader">
          <div className="DialogTop">
            <DialogTitle className="SubTitle">
              {t('modals.character.title')}
            </DialogTitle>
            <DialogTitle className="DialogTitle">
              {gridCharacter.object.name[locale]}
            </DialogTitle>
          </div>
          <DialogClose className="DialogClose" asChild>
            <span>
              <CrossIcon />
            </span>
          </DialogClose>
        </div>

        <div className="mods">
          {ringSelect()}
          {earringSelect()}
          {awakeningSelect()}
          <Button
            contained={true}
            onClick={updateCharacter}
            disabled={!formValid}
            text={t('modals.character.buttons.confirm')}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CharacterModal
