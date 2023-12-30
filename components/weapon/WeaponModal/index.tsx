import React, { PropsWithChildren, useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'next-i18next'
import { isEqual } from 'lodash'

import { GridWeaponObject } from '~types'
import Alert from '~components/common/Alert'
import { Dialog, DialogTrigger } from '~components/common/Dialog'
import DialogHeader from '~components/common/DialogHeader'
import DialogFooter from '~components/common/DialogFooter'
import DialogContent from '~components/common/DialogContent'
import AwakeningSelectWithInput from '~components/mastery/AwakeningSelectWithInput'
import AXSelect from '~components/mastery/AxSelect'
import ElementToggle from '~components/ElementToggle'
import WeaponKeySelect from '~components/weapon/WeaponKeySelect'
import Button from '~components/common/Button'

import { NO_AWAKENING } from '~data/awakening'

import styles from './index.module.scss'

interface Props {
  gridWeapon: GridWeapon
  open: boolean
  onOpenChange: (open: boolean) => void
  updateWeapon: (object: GridWeaponObject) => Promise<any>
}

const WeaponModal = ({
  gridWeapon,
  open: modalOpen,
  children,
  onOpenChange,
  updateWeapon,
}: PropsWithChildren<Props>) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

  // Cookies
  const cookie = getCookie('account')
  const accountData: AccountCookie = cookie
    ? JSON.parse(cookie as string)
    : null
  const headers = accountData
    ? { Authorization: `Bearer ${accountData.token}` }
    : {}

  // State: Component
  const [alertOpen, setAlertOpen] = useState(false)
  const [formValid, setFormValid] = useState(false)

  // State: Selects
  const [weaponKey1Open, setWeaponKey1Open] = useState(false)
  const [weaponKey2Open, setWeaponKey2Open] = useState(false)
  const [weaponKey3Open, setWeaponKey3Open] = useState(false)
  const [weaponKey4Open, setWeaponKey4Open] = useState(false)
  const [ax1Open, setAx1Open] = useState(false)
  const [ax2Open, setAx2Open] = useState(false)
  const [awakeningOpen, setAwakeningOpen] = useState(false)

  // State: Data

  const [element, setElement] = useState<number>(0)
  const [awakening, setAwakening] = useState<Awakening>()
  const [awakeningLevel, setAwakeningLevel] = useState(1)
  const [primaryAxModifier, setPrimaryAxModifier] = useState(-1)
  const [secondaryAxModifier, setSecondaryAxModifier] = useState(-1)
  const [primaryAxValue, setPrimaryAxValue] = useState(0.0)
  const [secondaryAxValue, setSecondaryAxValue] = useState(0.0)
  const [weaponKey1, setWeaponKey1] = useState<WeaponKey | undefined>()
  const [weaponKey2, setWeaponKey2] = useState<WeaponKey | undefined>()
  const [weaponKey3, setWeaponKey3] = useState<WeaponKey | undefined>()

  // Refs
  const headerRef = React.createRef<HTMLDivElement>()
  const footerRef = React.createRef<HTMLDivElement>()

  // Hooks

  // Set up modal data state when the gridWeapon changes
  useEffect(() => {
    setElement(gridWeapon.element)

    if (gridWeapon.weapon_keys) {
      gridWeapon.weapon_keys.forEach((key) => {
        if (key.slot + 1 === 1) {
          setWeaponKey1(key)
        } else if (key.slot + 1 === 2) {
          setWeaponKey2(key)
        } else if (key.slot + 1 === 3) {
          setWeaponKey3(key)
        }
      })
    }

    if (gridWeapon.awakening) {
      setAwakening(gridWeapon.awakening.type)
      setAwakeningLevel(gridWeapon.awakening.level)
    }

    if (gridWeapon.object.ax || gridWeapon.object.awakenings) {
      setFormValid(false)
    } else {
      setFormValid(true)
    }
  }, [gridWeapon])

  // Methods: Data retrieval

  // Receive values from ElementToggle
  function receiveElementValue(elementId: number) {
    setElement(elementId)
  }

  // Receive values from AXSelect
  function receiveAxValues(
    primaryAxModifier: number,
    primaryAxValue: number,
    secondaryAxModifier: number,
    secondaryAxValue: number
  ) {
    setPrimaryAxModifier(primaryAxModifier)
    setSecondaryAxModifier(secondaryAxModifier)

    setPrimaryAxValue(primaryAxValue)
    setSecondaryAxValue(secondaryAxValue)
  }

  // Receive values from AwakeningSelectWithInput
  function receiveAwakeningValues(id: string, level: number) {
    setAwakening(gridWeapon.object.awakenings.find((a) => a.id === id))
    console.log(level)
    setAwakeningLevel(level)
    setFormValid(true)
  }

  // Receive values from WeaponKeySelect
  function receiveWeaponKey(value: WeaponKey, slot: number) {
    if (slot === 0) setWeaponKey1(value)
    if (slot === 1) setWeaponKey2(value)
    if (slot === 2) setWeaponKey3(value)
  }

  // Receive form validity from child components
  function receiveValidity(isValid: boolean) {
    setFormValid(isValid)
  }

  // Methods: Data submission
  function prepareObject() {
    let object: GridWeaponObject = { weapon: {} }

    if (gridWeapon.object.element == 0) object.weapon.element = element

    if ([2, 3, 17, 24, 34].includes(gridWeapon.object.series) && weaponKey1) {
      object.weapon.weapon_key1_id = weaponKey1.id
    }

    if ([2, 3, 17, 34].includes(gridWeapon.object.series) && weaponKey2)
      object.weapon.weapon_key2_id = weaponKey2.id

    if ([17, 34].includes(gridWeapon.object.series) && weaponKey3)
      object.weapon.weapon_key3_id = weaponKey3.id

    if (gridWeapon.object.ax && gridWeapon.object.ax_type > 0) {
      object.weapon.ax_modifier1 = primaryAxModifier
      object.weapon.ax_modifier2 = secondaryAxModifier
      object.weapon.ax_strength1 = primaryAxValue
      object.weapon.ax_strength2 = secondaryAxValue
    }

    if (gridWeapon.object.awakenings) {
      object.weapon.awakening_id = awakening?.id
      object.weapon.awakening_level = awakeningLevel
    }

    return object
  }

  async function handleUpdateWeapon() {
    await updateWeapon(prepareObject())
    if (onOpenChange) onOpenChange(false)
  }

  // Methods: Event handlers
  const anySelectOpen =
    weaponKey1Open ||
    weaponKey2Open ||
    weaponKey3Open ||
    weaponKey4Open ||
    ax1Open ||
    ax2Open ||
    awakeningOpen

  function openSelect(index: 1 | 2 | 3 | 4) {
    setWeaponKey1Open(index === 1 ? !weaponKey1Open : false)
    setWeaponKey2Open(index === 2 ? !weaponKey2Open : false)
    setWeaponKey3Open(index === 3 ? !weaponKey3Open : false)
    setWeaponKey4Open(index === 4 ? !weaponKey4Open : false)
  }

  function receiveAxOpen(index: 1 | 2, isOpen: boolean) {
    if (index === 1) setAx1Open(isOpen)
    if (index === 2) setAx2Open(isOpen)
  }

  function receiveAwakeningOpen(isOpen: boolean) {
    setAwakeningOpen(isOpen)
  }

  function close() {
    // Reset values
    setElement(gridWeapon.element)
    setWeaponKey1(
      gridWeapon.weapon_keys && gridWeapon.weapon_keys[0]
        ? gridWeapon.weapon_keys[0]
        : undefined
    )
    setWeaponKey2(
      gridWeapon.weapon_keys && gridWeapon.weapon_keys[1]
        ? gridWeapon.weapon_keys[1]
        : undefined
    )
    setWeaponKey3(
      gridWeapon.weapon_keys && gridWeapon.weapon_keys[2]
        ? gridWeapon.weapon_keys[2]
        : undefined
    )
    setAwakening(gridWeapon.awakening?.type)
    setAwakeningLevel(gridWeapon.awakening?.level || 1)

    setAlertOpen(false)
    onOpenChange(false)
  }

  function handleOpenChange(open: boolean) {
    if (modalOpen && hasBeenModified()) {
      setAlertOpen(true)
    } else {
      onOpenChange(open)
    }
  }

  function onEscapeKeyDown(event: KeyboardEvent) {
    if (anySelectOpen) {
      return event.preventDefault()
    } else if (hasBeenModified()) {
      setAlertOpen(true)
    } else {
      close()
    }
  }

  // Methods: Modification checking
  function hasBeenModified() {
    return (
      elementChanged() ||
      weaponKeysChanged() ||
      axChanged() ||
      awakeningChanged()
    )
  }

  function elementChanged() {
    return element !== gridWeapon.element
  }

  function weaponKeyChanged(index: number) {
    // Get the correct key ID from the given index and
    // reset it to an empty string if it's 'no-key'
    let weaponKey =
      index === 0 ? weaponKey1 : index === 1 ? weaponKey2 : weaponKey3
    if (weaponKey && weaponKey.id === 'no-key') weaponKey = undefined

    // If the key is empty and the gridWeapon has no keys, nothing has changed
    if (weaponKey === undefined && !gridWeapon.weapon_keys) return false

    // If the key is not empty but the gridWeapon has no keys, the key has changed
    if (
      weaponKey !== undefined &&
      gridWeapon.weapon_keys &&
      gridWeapon.weapon_keys.length === 0
    )
      return true

    // If gridWeapon has a key at the current index, but it doesn't match the key ID,
    // then the key has changed
    const weaponKeyChanged =
      weaponKey &&
      gridWeapon.weapon_keys &&
      gridWeapon.weapon_keys[index] &&
      weaponKey.id !== gridWeapon.weapon_keys[index].id

    return weaponKeyChanged
  }

  function weaponKeysChanged() {
    if (!gridWeapon.weapon_keys) return false

    const weaponKey1Changed = weaponKeyChanged(0)
    const weaponKey2Changed = weaponKeyChanged(1)
    const weaponKey3Changed = weaponKeyChanged(2)

    return weaponKey1Changed || weaponKey2Changed || weaponKey3Changed
  }

  function axChanged() {
    if (!gridWeapon.ax) return false

    const ax1Changed =
      gridWeapon.ax[0].modifier !== primaryAxModifier ||
      gridWeapon.ax[0].strength !== primaryAxValue

    const ax2Changed =
      gridWeapon.ax[1].modifier !== secondaryAxModifier ||
      gridWeapon.ax[1].strength !== secondaryAxValue

    return ax1Changed || ax2Changed
  }

  function awakeningChanged() {
    if (!gridWeapon.awakening) return false

    // Check if the awakening in local state is different from the one on the current GridCharacter
    const awakeningChanged =
      !isEqual(gridWeapon.awakening.type, awakening) ||
      gridWeapon.awakening.level !== awakeningLevel

    console.log(
      gridWeapon.awakening.type,
      awakening,
      gridWeapon.awakening.level,
      awakeningLevel
    )
    // Return true if the awakening has been modified and is not empty
    return awakeningChanged
  }

  // Methods: Rendering
  const elementSelect = (
    <section>
      <h3>{t('modals.weapon.subtitles.element')}</h3>
      <ElementToggle
        currentElement={gridWeapon.element}
        sendValue={receiveElementValue}
      />
    </section>
  )

  const keySelect = (
    <section>
      <h3>{t('modals.weapon.subtitles.weapon_keys')}</h3>
      {[2, 3, 17, 22, 34].includes(gridWeapon.object.series) ? (
        <WeaponKeySelect
          open={weaponKey1Open}
          weaponKey={weaponKey1}
          series={gridWeapon.object.series}
          slot={0}
          onOpenChange={() => openSelect(1)}
          onChange={receiveWeaponKey}
          onClose={() => setWeaponKey1Open(false)}
        />
      ) : (
        ''
      )}

      {[2, 3, 17, 34].includes(gridWeapon.object.series) ? (
        <WeaponKeySelect
          open={weaponKey2Open}
          weaponKey={weaponKey2}
          series={gridWeapon.object.series}
          slot={1}
          onOpenChange={() => openSelect(2)}
          onChange={receiveWeaponKey}
          onClose={() => setWeaponKey2Open(false)}
        />
      ) : (
        ''
      )}

      {[17, 34].includes(gridWeapon.object.series) ? (
        <WeaponKeySelect
          open={weaponKey3Open}
          weaponKey={weaponKey3}
          series={gridWeapon.object.series}
          slot={2}
          onOpenChange={() => openSelect(3)}
          onChange={receiveWeaponKey}
          onClose={() => setWeaponKey3Open(false)}
        />
      ) : (
        ''
      )}

      {gridWeapon.object.series == 24 && gridWeapon.object.uncap.ulb ? (
        <WeaponKeySelect
          open={weaponKey4Open}
          weaponKey={weaponKey1}
          series={gridWeapon.object.series}
          slot={0}
          onOpenChange={() => openSelect(4)}
          onChange={receiveWeaponKey}
          onClose={() => setWeaponKey4Open(false)}
        />
      ) : (
        ''
      )}
    </section>
  )

  const axSelect = (
    <section>
      <h3>{t('modals.weapon.subtitles.ax_skills')}</h3>
      <AXSelect
        axType={gridWeapon.object.ax_type}
        currentSkills={gridWeapon.ax}
        onOpenChange={receiveAxOpen}
        sendValidity={receiveValidity}
        sendValues={receiveAxValues}
      />
    </section>
  )

  const awakeningSelect = (
    <section>
      <h3>{t('modals.weapon.subtitles.awakening')}</h3>
      <AwakeningSelectWithInput
        dataSet={gridWeapon.object.awakenings}
        awakening={gridWeapon.awakening?.type}
        level={gridWeapon.awakening?.level}
        defaultAwakening={NO_AWAKENING}
        maxLevel={gridWeapon.object.max_awakening_level}
        onOpenChange={receiveAwakeningOpen}
        sendValidity={receiveValidity}
        sendValues={receiveAwakeningValues}
      />
    </section>
  )

  const confirmationAlert = (
    <Alert
      message={
        <span>
          <Trans i18nKey="alert.unsaved_changes.object">
            You will lose all changes to{' '}
            <strong>{{ objectName: gridWeapon.object.name[locale] }}</strong> if
            you continue.
            <br />
            <br />
            Are you sure you want to continue without saving?
          </Trans>
        </span>
      }
      open={alertOpen}
      primaryActionText={t('alert.unsaved_changes.buttons.confirm')}
      primaryAction={close}
      cancelActionText={t('alert.unsaved_changes.buttons.cancel')}
      cancelAction={() => setAlertOpen(false)}
    />
  )

  return (
    <>
      {confirmationAlert}
      <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          className="Weapon"
          headerRef={headerRef}
          footerRef={footerRef}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={onEscapeKeyDown}
        >
          <DialogHeader
            ref={headerRef}
            title={gridWeapon.object.name[locale]}
            subtitle={t('modals.weapon.title')}
            image={{
              src: `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-square/${gridWeapon.object.granblue_id}.jpg`,
              alt: gridWeapon.object.name[locale],
            }}
          />
          <section className={styles.mods}>
            {gridWeapon.object.element == 0 && elementSelect}
            {[2, 3, 17, 24, 34].includes(gridWeapon.object.series) && keySelect}
            {gridWeapon.object.ax && axSelect}
            {gridWeapon.object.awakenings && awakeningSelect}
          </section>
          <DialogFooter
            ref={footerRef}
            rightElements={[
              <Button
                bound={true}
                onClick={handleUpdateWeapon}
                key="confirm"
                disabled={!formValid}
                text={t('modals.weapon.buttons.confirm')}
              />,
            ]}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default WeaponModal
