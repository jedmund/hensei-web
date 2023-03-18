import React, { useEffect, useState } from 'react'
import { getCookie, setCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from '~components/Dialog'
import DialogContent from '~components/DialogContent'

import Button from '~components/Button'
import InputTableField from '~components/InputTableField'
import SliderTableField from '~components/SliderTableField'
import SwitchTableField from '~components/SwitchTableField'

import type { DialogProps } from '@radix-ui/react-dialog'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

interface Props extends DialogProps {}

const DEFAULT_FULL_AUTO = false
const DEFAULT_AUTO_GUARD = false
const DEFAULT_CHARGE_ATTACK = false
const DEFAULT_MAX_BUTTONS = 0
const DEFAULT_MAX_TURNS = 0
const DEFAULT_MIN_CHARACTERS = 3
const DEFAULT_MIN_WEAPONS = 5
const DEFAULT_MIN_SUMMONS = 2
const DEFAULT_NAME_QUALITY = false
const DEFAULT_USER_QUALITY = false
const DEFAULT_ORIGINAL_ONLY = false

const MAX_CHARACTERS = 5
const MAX_WEAPONS = 13
const MAX_SUMMONS = 8

const FilterModal = (props: Props) => {
  // Set up router
  const router = useRouter()
  const locale = router.locale

  // Set up translation
  const { t } = useTranslation('common')

  // Refs
  const headerRef = React.createRef<HTMLDivElement>()
  const footerRef = React.createRef<HTMLDivElement>()

  // States
  const [open, setOpen] = useState(false)

  const [fullAuto, setFullAuto] = useState(DEFAULT_FULL_AUTO)
  const [autoGuard, setAutoGuard] = useState(DEFAULT_AUTO_GUARD)
  const [chargeAttack, setChargeAttack] = useState(DEFAULT_CHARGE_ATTACK)

  const [minCharacterCount, setMinCharacterCount] = useState(
    DEFAULT_MIN_CHARACTERS
  )
  const [minWeaponCount, setMinWeaponCount] = useState(DEFAULT_MIN_WEAPONS)
  const [minSummonCount, setMinSummonCount] = useState(DEFAULT_MIN_SUMMONS)

  const [maxButtonsCount, setMaxButtonsCount] = useState(DEFAULT_MAX_BUTTONS)
  const [maxTurnsCount, setMaxTurnsCount] = useState(DEFAULT_MAX_TURNS)

  const [userQuality, setUserQuality] = useState(DEFAULT_USER_QUALITY)
  const [nameQuality, setNameQuality] = useState(DEFAULT_NAME_QUALITY)
  const [originalOnly, setOriginalOnly] = useState(DEFAULT_ORIGINAL_ONLY)

  // Hooks
  useEffect(() => {
    if (props.open !== undefined) setOpen(props.open)
  })


  function resetFilters() {
    setFullAuto(DEFAULT_FULL_AUTO)
    setAutoGuard(DEFAULT_AUTO_GUARD)
    setChargeAttack(DEFAULT_CHARGE_ATTACK)
    setMinCharacterCount(DEFAULT_MIN_CHARACTERS)
    setMinWeaponCount(DEFAULT_MIN_WEAPONS)
    setMinSummonCount(DEFAULT_MIN_SUMMONS)
    setMaxButtonsCount(DEFAULT_MAX_BUTTONS)
    setMaxTurnsCount(DEFAULT_MAX_TURNS)
    setUserQuality(DEFAULT_USER_QUALITY)
    setNameQuality(DEFAULT_NAME_QUALITY)
    setOriginalOnly(DEFAULT_ORIGINAL_ONLY)
  }

  function openChange() {
    if (open) {
      setOpen(false)
      if (props.onOpenChange) props.onOpenChange(false)
    } else {
      setOpen(true)
      if (props.onOpenChange) props.onOpenChange(true)
    }
  }

  function onEscapeKeyDown(event: KeyboardEvent) {
    event.preventDefault()
    openChange()
  }

  function onOpenAutoFocus(event: Event) {
    event.preventDefault()
  }

  // Value listeners
  function handleChargeAttackValueChange(value: boolean) {
    setChargeAttack(value)
  }

  function handleFullAutoValueChange(value: boolean) {
    setFullAuto(value)
  }

  function handleAutoGuardValueChange(value: boolean) {
    setAutoGuard(value)
  }

  function handleMinCharactersValueChange(value: number) {
    setMinCharacterCount(value)
  }

  function handleMinSummonsValueChange(value: number) {
    setMinSummonCount(value)
  }

  function handleMinWeaponsValueChange(value: number) {
    setMinWeaponCount(value)
  }

  function handleMaxButtonsCountValueChange(value: number) {
    setMaxButtonsCount(value)
  }

  function handleMaxTurnsCountValueChange(value: number) {
    setMaxTurnsCount(value)
  }

  function handleNameQualityValueChange(value: boolean) {
    setNameQuality(value)
  }

  function handleUserQualityValueChange(value: boolean) {
    setUserQuality(value)
  }

  function handleOriginalOnlyValueChange(value: boolean) {
    setOriginalOnly(value)
  }

  const minCharactersField = () => (
    <SliderTableField
      name="min_characters"
      description={t('modals.filters.descriptions.min_characters')}
      label={t('modals.filters.labels.min_characters')}
      value={minCharacterCount}
      min={0}
      max={MAX_CHARACTERS}
      step={1}
      onValueChange={handleMinCharactersValueChange}
    />
  )

  const minWeaponsField = () => (
    <SliderTableField
      name="min_weapons"
      description={t('modals.filters.descriptions.min_weapons')}
      label={t('modals.filters.labels.min_weapons')}
      value={minWeaponCount}
      min={0}
      max={MAX_WEAPONS}
      step={1}
      onValueChange={handleMinWeaponsValueChange}
    />
  )

  const minSummonsField = () => (
    <SliderTableField
      name="min_summons"
      description={t('modals.filters.descriptions.min_summons')}
      label={t('modals.filters.labels.min_summons')}
      value={minSummonCount}
      min={0}
      max={MAX_SUMMONS}
      step={1}
      onValueChange={handleMinSummonsValueChange}
    />
  )

  const fullAutoField = () => (
    <SwitchTableField
      name="full_auto"
      label={t('modals.filters.labels.full_auto')}
      value={fullAuto}
      onValueChange={handleFullAutoValueChange}
    />
  )

  const autoGuardField = () => (
    <SwitchTableField
      name="auto_guard"
      label={t('modals.filters.labels.auto_guard')}
      value={autoGuard}
      onValueChange={handleAutoGuardValueChange}
    />
  )

  const chargeAttackField = () => (
    <SwitchTableField
      name="charge_attack"
      label={t('modals.filters.labels.charge_attack')}
      value={chargeAttack}
      onValueChange={handleChargeAttackValueChange}
    />
  )

  const nameQualityField = () => (
    <SwitchTableField
      name="name_quality"
      label={t('modals.filters.labels.name_quality')}
      value={nameQuality}
      onValueChange={handleNameQualityValueChange}
    />
  )

  const userQualityField = () => (
    <SwitchTableField
      name="user_quality"
      label={t('modals.filters.labels.user_quality')}
      value={userQuality}
      onValueChange={handleUserQualityValueChange}
    />
  )

  const originalOnlyField = () => (
    <SwitchTableField
      name="original_only"
      label={t('modals.filters.labels.original_only')}
      value={originalOnly}
      onValueChange={handleOriginalOnlyValueChange}
    />
  )

  const maxButtonsField = () => (
    <InputTableField
      name="min_characters"
      description={t('modals.filters.descriptions.max_buttons')}
      label={t('modals.filters.labels.max_buttons')}
      value={maxButtonsCount}
      onValueChange={handleMaxButtonsCountValueChange}
    />
  )

  const maxTurnsField = () => (
    <InputTableField
      name="min_turns"
      description={t('modals.filters.descriptions.max_turns')}
      label={t('modals.filters.labels.max_turns')}
      value={maxTurnsCount}
      onValueChange={handleMaxTurnsCountValueChange}
    />
  )

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent
        className="Filter"
        headerref={headerRef}
        footerref={footerRef}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <div className="DialogHeader" ref={headerRef}>
          <div className="DialogTop">
            <DialogTitle className="DialogTitle">
              {t('modals.filters.title')}
            </DialogTitle>
          </div>
          <DialogClose className="DialogClose" asChild>
            <span>
              <CrossIcon />
            </span>
          </DialogClose>
        </div>

        <div className="Fields">
          {chargeAttackField()}
          {fullAutoField()}
          {autoGuardField()}
          {maxButtonsField()}
          {maxTurnsField()}
          {minCharactersField()}
          {minSummonsField()}
          {minWeaponsField()}
          {nameQualityField()}
          {userQualityField()}
          {originalOnlyField()}
        </div>
        <div className="DialogFooter" ref={footerRef}>
          <div className="Buttons Spaced">
            <Button
              blended={true}
              text={t('modals.filters.buttons.clear')}
              onClick={resetFilters}
            />
            <Button
              contained={true}
              text={t('modals.filters.buttons.confirm')}
              onClick={saveFilters}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FilterModal
