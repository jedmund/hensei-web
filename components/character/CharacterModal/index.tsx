// Core dependencies
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

// UI dependencies
import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from '~components/common/Dialog'
import DialogContent from '~components/common/DialogContent'
import Button from '~components/common/Button'
import SelectWithInput from '~components/common/SelectWithInput'
import RingSelect from '~components/mastery/RingSelect'
import Switch from '~components/common/Switch'

// Utilities
import elementalizeAetherialMastery from '~utils/elementalizeAetherialMastery'

// Data
const emptyExtendedMastery: ExtendedMastery = {
  modifier: 0,
  strength: 0,
}

const MAX_AWAKENING_LEVEL = 9

// Styles and icons
import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

// Types
import {
  CharacterOverMastery,
  ExtendedMastery,
  GridCharacterObject,
} from '~types'
import AwakeningSelectWithInput from '~components/mastery/AwakeningSelectWithInput'

interface Props {
  gridCharacter: GridCharacter
  open: boolean
  onOpenChange: (open: boolean) => void
  updateCharacter: (object: GridCharacterObject) => Promise<any>
}

const CharacterModal = ({
  gridCharacter,
  children,
  open: modalOpen,
  onOpenChange,
  updateCharacter,
}: PropsWithChildren<Props>) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

  // UI state
  const [open, setOpen] = useState(false)
  const [formValid, setFormValid] = useState(false)

  // Refs
  const headerRef = React.createRef<HTMLDivElement>()
  const footerRef = React.createRef<HTMLDivElement>()

  // Classes
  const headerClasses = classNames({
    DialogHeader: true,
    Short: true,
  })

  // Callbacks and Hooks
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
  const [awakening, setAwakening] = useState<Awakening>()
  const [awakeningLevel, setAwakeningLevel] = useState(1)

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

    setAwakening(gridCharacter.awakening.type)
    setAwakeningLevel(gridCharacter.awakening.level)
    setPerpetuity(gridCharacter.perpetuity)
  }, [gridCharacter])

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
        transcendence_step: transcendenceStep,
        perpetuity: perpetuity,
      },
    }

    if (awakening) {
      object.character.awakening_id = awakening.id
      object.character.awakening_level = awakeningLevel
    }

    return object
  }

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

  async function handleUpdateCharacter() {
    await updateCharacter(prepareObject())

    setOpen(false)
    if (onOpenChange) onOpenChange(false)
  }

  function receiveAwakeningValues(id: string, level: number) {
    setAwakening(gridCharacter.object.awakenings.find((a) => a.id === id))
    setAwakeningLevel(level)
  }

  function receiveValidity(isValid: boolean) {
    setFormValid(isValid)
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
        <AwakeningSelectWithInput
          dataSet={gridCharacter.object.awakenings}
          awakening={gridCharacter.awakening.type}
          level={gridCharacter.awakening.level}
          defaultAwakening={
            gridCharacter.object.awakenings.find(
              (a) => a.slug === 'character-balanced'
            )!
          }
          maxLevel={MAX_AWAKENING_LEVEL}
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
        headerref={headerRef}
        footerref={footerRef}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={() => {}}
      >
        <div className={headerClasses} ref={headerRef}>
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
        <div className="DialogFooter" ref={footerRef}>
          <Button
            contained={true}
            onClick={handleUpdateCharacter}
            disabled={!formValid}
            text={t('modals.characters.buttons.confirm')}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CharacterModal
