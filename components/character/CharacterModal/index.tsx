// Core dependencies
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import isEqual from 'lodash/isEqual'

// UI dependencies
import Alert from '~components/common/Alert'
import { Dialog, DialogTrigger } from '~components/common/Dialog'
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
import styles from './index.module.scss'

// Types
import {
  CharacterOverMastery,
  ExtendedMastery,
  GridCharacterObject,
} from '~types'
import AwakeningSelectWithInput from '~components/mastery/AwakeningSelectWithInput'
import DialogHeader from '~components/common/DialogHeader'
import DialogFooter from '~components/common/DialogFooter'

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
  // Router and localization
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

  // State: Component
  const [alertOpen, setAlertOpen] = useState(false)

  // State: Data
  const [perpetuity, setPerpetuity] = useState(false)
  const [rings, setRings] = useState<CharacterOverMastery>({
    1: { ...emptyExtendedMastery, modifier: 1 },
    2: { ...emptyExtendedMastery, modifier: 2 },
    3: emptyExtendedMastery,
    4: emptyExtendedMastery,
  })
  const [earring, setEarring] = useState<ExtendedMastery>(emptyExtendedMastery)
  const [awakening, setAwakening] = useState<Awakening>()
  const [awakeningLevel, setAwakeningLevel] = useState(1)
  const [transcendenceStep, setTranscendenceStep] = useState(0)

  // Hooks
  useEffect(() => {
    setOpen(modalOpen)
  }, [modalOpen])

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

  // Methods: Convenience
  function hasBeenModified() {
    const rings = ringsChanged()
    const aetherialMastery = aetherialMasteryChanged()
    const awakening = awakeningChanged()

    return (
      rings ||
      aetherialMastery ||
      awakening ||
      gridCharacter.perpetuity !== perpetuity
    )
  }

  function ringsChanged() {
    // Create an empty ExtendedMastery object
    const emptyRingset: CharacterOverMastery = {
      1: { ...emptyExtendedMastery, modifier: 1 },
      2: { ...emptyExtendedMastery, modifier: 2 },
      3: emptyExtendedMastery,
      4: emptyExtendedMastery,
    }

    // Check if the current ringset is empty on the current GridCharacter and our local state
    const isEmptyRingset =
      gridCharacter.over_mastery === undefined && isEqual(emptyRingset, rings)

    // Check if the ringset in local state is different from the one on the current GridCharacter
    const ringsChanged = !isEqual(gridCharacter.over_mastery, rings)

    // Return true if the ringset has been modified and is not empty
    return ringsChanged && !isEmptyRingset
  }

  function aetherialMasteryChanged() {
    // Create an empty ExtendedMastery object
    const emptyAetherialMastery: ExtendedMastery = {
      modifier: 0,
      strength: 0,
    }

    // Check if the current earring is empty on the current GridCharacter and our local state
    const isEmptyRingset =
      gridCharacter.aetherial_mastery === undefined &&
      isEqual(emptyAetherialMastery, earring)

    // Check if the earring in local state is different from the one on the current GridCharacter
    const aetherialMasteryChanged = !isEqual(
      gridCharacter.aetherial_mastery,
      earring
    )

    // Return true if the earring has been modified and is not empty
    return aetherialMasteryChanged && !isEmptyRingset
  }

  function awakeningChanged() {
    // Check if the awakening in local state is different from the one on the current GridCharacter
    const awakeningChanged =
      !isEqual(gridCharacter.awakening.type, awakening) ||
      gridCharacter.awakening.level !== awakeningLevel

    // Return true if the awakening has been modified and is not empty
    return awakeningChanged
  }

  // Methods: UI state management
  function handleOpenChange(open: boolean) {
    if (hasBeenModified()) {
      setAlertOpen(!open)
    } else {
      setOpen(open)
      onOpenChange(open)
    }
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
      strength: earringModifier > 0 ? earringStrength : 0,
    })
  }

  function receiveAwakeningValues(id: string, level: number) {
    setAwakening(gridCharacter.object.awakenings.find((a) => a.id === id))
    setAwakeningLevel(level)
  }

  function receiveValidity(isValid: boolean) {
    setFormValid(isValid)
  }

  // Methods: Event handlers
  function handleCheckedChange(checked: boolean) {
    setPerpetuity(checked)
  }

  async function handleUpdateCharacter() {
    await updateCharacter(prepareObject())

    setOpen(false)
    if (onOpenChange) onOpenChange(false)
  }

  function close() {
    setAlertOpen(false)
    setOpen(false)
    onOpenChange(false)
  }

  // Constants: Rendering
  const confirmationAlert = (
    <Alert
      message={
        <span>
          You will lose all changes to{' '}
          <strong>{gridCharacter.object.name[locale]}</strong> if you continue.
          <br />
          <br />
          Are you sure you want to continue without saving?
        </span>
      }
      open={alertOpen}
      primaryActionText="Close"
      primaryAction={close}
      cancelActionText="Nevermind"
      cancelAction={() => setAlertOpen(false)}
    />
  )

  const ringSelect = (
    <section>
      <h3>{t('modals.characters.subtitles.ring')}</h3>
      <RingSelect
        gridCharacter={gridCharacter}
        sendValues={receiveRingValues}
      />
    </section>
  )

  const earringSelect = (
    <section>
      <h3>{t('modals.characters.subtitles.earring')}</h3>
      <SelectWithInput
        object="earring"
        dataSet={elementalizeAetherialMastery(gridCharacter)}
        selectValue={
          gridCharacter.aetherial_mastery
            ? gridCharacter.aetherial_mastery.modifier
            : 0
        }
        inputValue={
          gridCharacter.aetherial_mastery
            ? gridCharacter.aetherial_mastery.strength
            : 0
        }
        sendValidity={receiveValidity}
        sendValues={receiveEarringValues}
      />
    </section>
  )

  const awakeningSelect = (
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

  const perpetuitySwitch = (
    <section className={styles.inline}>
      <h3>{t('modals.characters.subtitles.permanent')}</h3>
      <Switch onCheckedChange={handleCheckedChange} checked={perpetuity} />
    </section>
  )

  // Methods: Rendering
  return (
    <>
      {confirmationAlert}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          className="character"
          headerref={headerRef}
          footerref={footerRef}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={() => {}}
        >
          <DialogHeader
            ref={headerRef}
            title={gridCharacter.object.name[locale]}
            subtitle={t('modals.characters.title')}
            image={{
              src: `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-square/${gridCharacter.object.granblue_id}_01.jpg`,
              alt: gridCharacter.object.name[locale],
            }}
          />
          <section className={styles.mods}>
            {perpetuitySwitch}
            {ringSelect}
            {earringSelect}
            {awakeningSelect}
          </section>
          <DialogFooter
            ref={footerRef}
            rightElements={[
              <Button
                bound={true}
                onClick={handleUpdateCharacter}
                key="confirm"
                disabled={!formValid}
                text={t('modals.characters.buttons.confirm')}
              />,
            ]}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CharacterModal
