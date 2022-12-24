import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { AxiosResponse } from 'axios'

import * as Dialog from '@radix-ui/react-dialog'

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

const WeaponModal = (props: Props) => {
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

  const [awakeningType, setAwakeningType] = useState(-1)
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

  useEffect(() => {
    setElement(props.gridWeapon.element)

    if (props.gridWeapon.weapon_keys) {
      props.gridWeapon.weapon_keys.forEach((key) => {
        if (key.slot + 1 === 1) {
          setWeaponKey1(key)
        } else if (key.slot + 1 === 2) {
          setWeaponKey2(key)
        } else if (key.slot + 1 === 3) {
          setWeaponKey3(key)
        }
      })
    }
  }, [props])

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

    if (props.gridWeapon.object.element == 0) object.weapon.element = element

    if (
      [2, 3, 17, 24].includes(props.gridWeapon.object.series) &&
      weaponKey1Id
    ) {
      object.weapon.weapon_key1_id = weaponKey1Id
    }

    if ([2, 3, 17].includes(props.gridWeapon.object.series) && weaponKey2Id)
      object.weapon.weapon_key2_id = weaponKey2Id

    if (props.gridWeapon.object.series == 17 && weaponKey3Id)
      object.weapon.weapon_key3_id = weaponKey3Id

    if (props.gridWeapon.object.ax > 0) {
      object.weapon.ax_modifier1 = primaryAxModifier
      object.weapon.ax_modifier2 = secondaryAxModifier
      object.weapon.ax_strength1 = primaryAxValue
      object.weapon.ax_strength2 = secondaryAxValue
    }

    if (props.gridWeapon.object.awakening) {
      object.weapon.awakening_type = awakeningType
      object.weapon.awakening_level = awakeningLevel
    }

    return object
  }

  async function updateWeapon() {
    const updateObject = prepareObject()
    return await api.endpoints.grid_weapons
      .update(props.gridWeapon.id, updateObject, headers)
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

  const keySelect = () => {
    return (
      <section>
        <h3>{t('modals.weapon.subtitles.weapon_keys')}</h3>
        {[2, 3, 17, 22].includes(props.gridWeapon.object.series) ? (
          <WeaponKeySelect
            currentValue={weaponKey1 != null ? weaponKey1 : undefined}
            series={props.gridWeapon.object.series}
            slot={0}
            onChange={receiveWeaponKey}
          />
        ) : (
          ''
        )}

        {[2, 3, 17].includes(props.gridWeapon.object.series) ? (
          <WeaponKeySelect
            currentValue={weaponKey2 != null ? weaponKey2 : undefined}
            series={props.gridWeapon.object.series}
            slot={1}
            onChange={receiveWeaponKey}
          />
        ) : (
          ''
        )}

        {props.gridWeapon.object.series == 17 ? (
          <WeaponKeySelect
            currentValue={weaponKey3 != null ? weaponKey3 : undefined}
            series={props.gridWeapon.object.series}
            slot={2}
            onChange={receiveWeaponKey}
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
          axType={props.gridWeapon.object.ax}
          currentSkills={props.gridWeapon.ax}
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
          awakeningType={props.gridWeapon.awakening?.type}
          awakeningLevel={props.gridWeapon.awakening?.level}
          sendValidity={receiveValidity}
          sendValues={receiveAwakeningValues}
        />
      </section>
    )
  }

  function openChange(open: boolean) {
    if (props.gridWeapon.object.ax > 0 || props.gridWeapon.object.awakening) {
      setFormValid(false)
    } else {
      setFormValid(true)
    }
    setOpen(open)
  }

  return (
    // TODO: Refactor into Dialog component
    <Dialog.Root open={open} onOpenChange={openChange}>
      <Dialog.Trigger asChild>{props.children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          className="Weapon Dialog"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="DialogHeader">
            <div className="DialogTop">
              <Dialog.Title className="SubTitle">
                {t('modals.weapon.title')}
              </Dialog.Title>
              <Dialog.Title className="DialogTitle">
                {props.gridWeapon.object.name[locale]}
              </Dialog.Title>
            </div>
            <Dialog.Close className="DialogClose" asChild>
              <span>
                <CrossIcon />
              </span>
            </Dialog.Close>
          </div>

          <div className="mods">
            {props.gridWeapon.object.element == 0 ? elementSelect() : ''}
            {[2, 3, 17, 24].includes(props.gridWeapon.object.series)
              ? keySelect()
              : ''}
            {props.gridWeapon.object.ax > 0 ? axSelect() : ''}
            {props.gridWeapon.awakening ? awakeningSelect() : ''}
            <Button
              contained={true}
              onClick={updateWeapon}
              disabled={!formValid}
              text={t('modals.weapon.buttons.confirm')}
            />
          </div>
        </Dialog.Content>
        <Dialog.Overlay className="Overlay" />
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default WeaponModal
