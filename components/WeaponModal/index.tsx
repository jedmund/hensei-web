import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { AxiosResponse } from 'axios'

import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from '~components/Dialog'
import DialogContent from '~components/DialogContent'
import AXSelect from '~components/AxSelect'
import AwakeningSelect from '~components/AwakeningSelect'
import ElementToggle from '~components/ElementToggle'
import WeaponKeySelect from '~components/WeaponKeySelect'
import Button from '~components/Button'

import api from '~utils/api'
import { appState } from '~utils/appState'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

interface GridWeaponObject {
  weapon: {
    element?: number
    weapon_key1_id?: string
    weapon_key2_id?: string
    weapon_key3_id?: string
    ax_modifier1?: number
    ax_modifier2?: number
    ax_strength1?: number
    ax_strength2?: number
    awakening_type?: number
    awakening_level?: Number
  }
}

interface Props {
  gridWeapon: GridWeapon
  children: React.ReactNode
}

const WeaponModal = ({ gridWeapon, children }: Props) => {
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

  // State
  const [open, setOpen] = useState(false)
  const [formValid, setFormValid] = useState(false)

  const [element, setElement] = useState(-1)

  const [awakeningType, setAwakeningType] = useState(0)
  const [awakeningLevel, setAwakeningLevel] = useState(1)

  const [primaryAxModifier, setPrimaryAxModifier] = useState(-1)
  const [secondaryAxModifier, setSecondaryAxModifier] = useState(-1)
  const [primaryAxValue, setPrimaryAxValue] = useState(0.0)
  const [secondaryAxValue, setSecondaryAxValue] = useState(0.0)

  const [weaponKey1, setWeaponKey1] = useState<WeaponKey | undefined>()
  const [weaponKey2, setWeaponKey2] = useState<WeaponKey | undefined>()
  const [weaponKey3, setWeaponKey3] = useState<WeaponKey | undefined>()
  const [weaponKey1Id, setWeaponKey1Id] = useState('')
  const [weaponKey2Id, setWeaponKey2Id] = useState('')
  const [weaponKey3Id, setWeaponKey3Id] = useState('')

  const [weaponKey1Open, setWeaponKey1Open] = useState(false)
  const [weaponKey2Open, setWeaponKey2Open] = useState(false)
  const [weaponKey3Open, setWeaponKey3Open] = useState(false)
  const [weaponKey4Open, setWeaponKey4Open] = useState(false)
  const [ax1Open, setAx1Open] = useState(false)
  const [ax2Open, setAx2Open] = useState(false)
  const [awakeningOpen, setAwakeningOpen] = useState(false)

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
  }, [gridWeapon])

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

  function receiveValidity(isValid: boolean) {
    setFormValid(isValid)
  }

  function receiveAwakeningValues(type: number, level: number) {
    setAwakeningType(type)
    setAwakeningLevel(level)
  }

  function receiveElementValue(element: string) {
    setElement(parseInt(element))
  }

  function prepareObject() {
    let object: GridWeaponObject = { weapon: {} }

    if (gridWeapon.object.element == 0) object.weapon.element = element

    if ([2, 3, 17, 24].includes(gridWeapon.object.series) && weaponKey1Id) {
      object.weapon.weapon_key1_id = weaponKey1Id
    }

    if ([2, 3, 17].includes(gridWeapon.object.series) && weaponKey2Id)
      object.weapon.weapon_key2_id = weaponKey2Id

    if (gridWeapon.object.series == 17 && weaponKey3Id)
      object.weapon.weapon_key3_id = weaponKey3Id

    if (gridWeapon.object.ax && gridWeapon.object.ax_type > 0) {
      object.weapon.ax_modifier1 = primaryAxModifier
      object.weapon.ax_modifier2 = secondaryAxModifier
      object.weapon.ax_strength1 = primaryAxValue
      object.weapon.ax_strength2 = secondaryAxValue
    }

    if (gridWeapon.object.awakening) {
      object.weapon.awakening_type = awakeningType
      object.weapon.awakening_level = awakeningLevel
    }

    return object
  }

  async function updateWeapon() {
    const updateObject = prepareObject()
    return await api.endpoints.grid_weapons
      .update(gridWeapon.id, updateObject, headers)
      .then((response) => processResult(response))
      .catch((error) => processError(error))
  }

  function processResult(response: AxiosResponse) {
    const gridWeapon: GridWeapon = response.data

    if (gridWeapon.mainhand) appState.grid.weapons.mainWeapon = gridWeapon
    else appState.grid.weapons.allWeapons[gridWeapon.position] = gridWeapon

    setOpen(false)
  }

  function processError(error: any) {
    console.error(error)
  }

  function receiveWeaponKey(value: string, slot: number) {
    if (slot === 0) setWeaponKey1Id(value)
    if (slot === 1) setWeaponKey2Id(value)
    if (slot === 2) setWeaponKey3Id(value)
  }

  const elementSelect = () => {
    return (
      <section>
        <h3>{t('modals.weapon.subtitles.element')}</h3>
        <ElementToggle
          currentElement={element}
          sendValue={receiveElementValue}
        />
      </section>
    )
  }

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

  const keySelect = () => {
    return (
      <section>
        <h3>{t('modals.weapon.subtitles.weapon_keys')}</h3>
        {[2, 3, 17, 22].includes(gridWeapon.object.series) ? (
          <WeaponKeySelect
            open={weaponKey1Open}
            currentValue={weaponKey1 != null ? weaponKey1 : undefined}
            series={gridWeapon.object.series}
            slot={0}
            onOpenChange={() => openSelect(1)}
            onChange={receiveWeaponKey}
            onClose={() => setWeaponKey1Open(false)}
          />
        ) : (
          ''
        )}

        {[2, 3, 17].includes(gridWeapon.object.series) ? (
          <WeaponKeySelect
            open={weaponKey2Open}
            currentValue={weaponKey2 != null ? weaponKey2 : undefined}
            series={gridWeapon.object.series}
            slot={1}
            onOpenChange={() => openSelect(2)}
            onChange={receiveWeaponKey}
            onClose={() => setWeaponKey2Open(false)}
          />
        ) : (
          ''
        )}

        {gridWeapon.object.series == 17 ? (
          <WeaponKeySelect
            open={weaponKey3Open}
            currentValue={weaponKey3 != null ? weaponKey3 : undefined}
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
            currentValue={weaponKey1 != null ? weaponKey1 : undefined}
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
  }

  const axSelect = () => {
    return (
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
  }

  const awakeningSelect = () => {
    return (
      <section>
        <h3>{t('modals.weapon.subtitles.awakening')}</h3>
        <AwakeningSelect
          object="weapon"
          type={gridWeapon.awakening?.type}
          level={gridWeapon.awakening?.level}
          onOpenChange={receiveAwakeningOpen}
          sendValidity={receiveValidity}
          sendValues={receiveAwakeningValues}
        />
      </section>
    )
  }

  function openChange(open: boolean) {
    if (gridWeapon.object.ax || gridWeapon.object.awakening) {
      setFormValid(false)
    } else {
      setFormValid(true)
    }
    setOpen(open)
  }

  const anySelectOpen =
    weaponKey1Open ||
    weaponKey2Open ||
    weaponKey3Open ||
    weaponKey4Open ||
    ax1Open ||
    ax2Open ||
    awakeningOpen

  function onEscapeKeyDown(event: KeyboardEvent) {
    if (anySelectOpen) {
      return event.preventDefault()
    } else {
      setOpen(false)
    }
  }

  return (
    // TODO: Refactor into Dialog component
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="Weapon"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={onEscapeKeyDown}
      >
        <div className="DialogHeader">
          <img
            alt={gridWeapon.object.name[locale]}
            className="DialogImage"
            src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-square/${gridWeapon.object.granblue_id}.jpg`}
          />
          <div className="DialogTop">
            <DialogTitle className="SubTitle">
              {t('modals.weapon.title')}
            </DialogTitle>
            <DialogTitle className="DialogTitle">
              {gridWeapon.object.name[locale]}
            </DialogTitle>
          </div>
          <DialogClose className="DialogClose" asChild>
            <span>
              <CrossIcon />
            </span>
          </DialogClose>
        </div>

        <div className="mods">
          {gridWeapon.object.element == 0 ? elementSelect() : ''}
          {[2, 3, 17, 24].includes(gridWeapon.object.series) ? keySelect() : ''}
          {gridWeapon.object.ax ? axSelect() : ''}
          {gridWeapon.awakening ? awakeningSelect() : ''}
        </div>
        <div className="DialogFooter">
          <Button
            contained={true}
            onClick={updateWeapon}
            disabled={!formValid}
            text={t('modals.weapon.buttons.confirm')}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default WeaponModal
