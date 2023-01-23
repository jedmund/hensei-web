// Core dependencies
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { AxiosResponse } from 'axios'
import classNames from 'classnames'

// UI dependencies
import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from '~components/Dialog'
import DialogContent from '~components/DialogContent'
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
    ring1: ExtendedMastery
    ring2: ExtendedMastery
    ring3: ExtendedMastery
    ring4: ExtendedMastery
    earring: ExtendedMastery
    awakening: {
      type?: number
      level?: number
    }
    transcendence_step: number
    perpetuity: boolean
  }
}

interface Props {
  gridCharacter: GridCharacter
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CharacterModal = ({
  gridCharacter,
  children,
  open: modalOpen,
  onOpenChange,
}: PropsWithChildren<Props>) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

  // Cookies
  const cookies = retrieveCookies()

  // UI state
  const [open, setOpen] = useState(false)
  const [formValid, setFormValid] = useState(false)

  // Classes
  const headerClasses = classNames({
    DialogHeader: true,
    Scrolled: scrolled,
  })
  useEffect(() => {
    setOpen(modalOpen)
  }, [modalOpen])

  // Character properties: Perpetuity
  const [perpetuity, setPerpetuity] = useState(false)

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
  useEffect(() => {
    if (gridCharacter.aetherial_mastery) {
      setEarring({
        modifier: gridCharacter.aetherial_mastery.modifier,
        strength: gridCharacter.aetherial_mastery.strength,
      })
    }

    setAwakeningType(gridCharacter.awakening.type)
    setAwakeningLevel(gridCharacter.awakening.level)
    setPerpetuity(gridCharacter.perpetuity)
  }, [gridCharacter])

  // Methods: UI state management
  function handleOpenChange(open: boolean) {
    setOpen(open)
    onOpenChange(open)
  }

  // Methods: Receive data from components
  function receiveRingValues(overMastery: CharacterOverMastery) {
    setRings(overMastery)
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

  function handleCheckedChange(checked: boolean) {
    setPerpetuity(checked)
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
        ring1: {
          modifier: rings[1].modifier,
          strength: rings[1].strength,
        },
        ring2: {
          modifier: rings[2].modifier,
          strength: rings[2].strength,
        },
        ring3: {
          modifier: rings[3].modifier,
          strength: rings[3].strength,
        },
        ring4: {
          modifier: rings[4].modifier,
          strength: rings[4].strength,
        },
        earring: {
          modifier: earring.modifier,
          strength: earring.strength,
        },
        awakening: {
          type: awakeningType,
          level: awakeningLevel,
        },
        transcendence_step: transcendenceStep,
        perpetuity: perpetuity,
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
    if (onOpenChange) onOpenChange(false)
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
          selectValue={earring.modifier ? earring.modifier : 0}
          inputValue={earring.strength ? earring.strength : 0}
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
          type={awakeningType}
          level={awakeningLevel}
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
        <Switch onCheckedChange={handleCheckedChange} checked={perpetuity} />
      </section>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="Character"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={() => {}}
      >
        <div className={headerClasses}>
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
        </div>
        <div className="DialogFooter">
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
