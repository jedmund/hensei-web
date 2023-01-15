// Core dependencies
import React, { useEffect, useState } from 'react'
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
import SelectWithInput from '~components/SelectWithInput'
import AwakeningSelect from '~components/AwakeningSelect'
import RingSelect from '~components/RingSelect'
import Switch from '~components/Switch'

// Utilities
import api from '~utils/api'
import { appState } from '~utils/appState'
import { retrieveCookies } from '~utils/retrieveCookies'
import elementalizeAetherialMastery from '~utils/elementalizeAetherialMastery'

// Data
const emptyExtendedMastery: ExtendedMastery = {
  modifier: 0,
  strength: 0,
}

// Styles and icons
import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

// Types
import { CharacterOverMastery, ExtendedMastery } from '~types'

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
    earring_modifier: number
    earring_strength: number
    awakening_type: number
    awakening_level: number
    transcendence_step: number
  }
}

interface Props {
  gridCharacter: GridCharacter
  children?: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CharacterModal = ({
  gridCharacter,
  children,
  open: modalOpen,
  onOpenChange,
}: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

  // Cookies
  const cookies = retrieveCookies()

  // UI state
  const [open, setOpen] = useState(false)
  const [formValid, setFormValid] = useState(false)

  useEffect(() => {
    setOpen(modalOpen)
  }, [modalOpen])

  // Character properties: Ring
  const [rings, setRings] = useState<CharacterOverMastery>({
    1: { ...emptyExtendedMastery, modifier: 1 },
    2: { ...emptyExtendedMastery, modifier: 2 },
    3: emptyExtendedMastery,
    4: emptyExtendedMastery,
  })

  // Character properties: Earrings
  const [earring, setEarring] = useState<ExtendedMastery>(emptyExtendedMastery)

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
    onOpenChange(open)
  }

  // Methods: Receive data from components
  function receiveRingValues(overMastery: CharacterOverMastery) {
    console.log(overMastery)

    setRings({
      1: {
        modifier: overMastery[1].modifier,
        strength: overMastery[1].strength,
      },
      2: {
        modifier: overMastery[2].modifier,
        strength: overMastery[2].strength,
      },
      3: {
        modifier: overMastery[3].modifier,
        strength: overMastery[3].strength,
      },
      4: {
        modifier: overMastery[4].modifier,
        strength: overMastery[4].strength,
      },
    })
  }

  function receiveEarringValues(
    earringModifier: number,
    earringStrength: number
  ) {
    setEarring({
      modifier: earringModifier,
      strength: earringStrength,
    })
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
        ring_modifier1: rings[1].modifier,
        ring_modifier2: rings[2].modifier,
        ring_modifier3: rings[3].modifier,
        ring_modifier4: rings[4].modifier,
        ring_strength1: rings[1].strength,
        ring_strength2: rings[2].strength,
        ring_strength3: rings[3].strength,
        ring_strength4: rings[4].strength,
        earring_modifier: earring.modifier,
        earring_strength: earring.strength,
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
    console.log(updateObject)
    // return await api.endpoints.grid_characters
    //   .update(gridCharacter.id, updateObject)
    //   .then((response) => processResult(response))
    //   .catch((error) => processError(error))
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
          sendValues={receiveRingValues}
        />
      </section>
    )
  }

  const earringSelect = () => {
    const earringData = elementalizeAetherialMastery(gridCharacter)

    return (
      <section>
        <h3>{t('modals.characters.subtitles.earring')}</h3>
        <SelectWithInput
          object="earring"
          dataSet={earringData}
          selectValue={earring.modifier}
          inputValue={earring.strength}
          sendValidity={receiveValidity}
          sendValues={receiveEarringValues}
        />
      </section>
    )
  }

  const awakeningSelect = () => {
    return (
      <section>
        <h3>{t('modals.characters.subtitles.awakening')}</h3>
        <AwakeningSelect
          object="character"
          awakeningType={gridCharacter.awakening?.type}
          awakeningLevel={gridCharacter.awakening?.level}
          sendValidity={receiveValidity}
          sendValues={receiveAwakeningValues}
        />
      </section>
    )
  }

  const perpetuitySwitch = () => {
    return (
      <section className="inline">
        <h3>{t('modals.characters.subtitles.permanent')}</h3>
        <Switch />
      </section>
    )
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="Character Dialog"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={() => {}}
      >
        <div className="DialogHeader">
          <img
            alt={gridCharacter.object.name[locale]}
            className="DialogImage"
            src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-square/${gridCharacter.object.granblue_id}_01.jpg`}
          />
          <div className="DialogTop">
            <DialogTitle className="SubTitle">
              {t('modals.characters.title')}
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
          {perpetuitySwitch()}
          {ringSelect()}
          {earringSelect()}
          {awakeningSelect()}
          <Button
            contained={true}
            onClick={updateCharacter}
            disabled={!formValid}
            text={t('modals.characters.buttons.confirm')}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CharacterModal
