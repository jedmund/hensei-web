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

interface Props extends DialogProps {
  defaultFilterSet: FilterSet
  filterSet: FilterSet
}

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

  const [fullAuto, setFullAuto] = useState(props.filterSet.full_auto)
  const [autoGuard, setAutoGuard] = useState(props.filterSet.auto_guard)
  const [chargeAttack, setChargeAttack] = useState(
    props.filterSet.charge_attack
  )

  const [minCharacterCount, setMinCharacterCount] = useState(
    props.filterSet.characters_count
  )
  const [minWeaponCount, setMinWeaponCount] = useState(
    props.filterSet.weapons_count
  )
  const [minSummonCount, setMinSummonCount] = useState(
    props.filterSet.summons_count
  )
  const [maxButtonsCount, setMaxButtonsCount] = useState(
    props.filterSet.button_count
  )
  const [maxTurnsCount, setMaxTurnsCount] = useState(props.filterSet.turn_count)

  const [userQuality, setUserQuality] = useState(props.filterSet.user_quality)
  const [nameQuality, setNameQuality] = useState(props.filterSet.name_quality)
  const [originalOnly, setOriginalOnly] = useState(props.filterSet.original)

  // Hooks
  useEffect(() => {
    if (props.open !== undefined) setOpen(props.open)
  })

  function saveFilters() {
    const filters = {
      full_auto: fullAuto,
      auto_guard: autoGuard,
      charge_attack: chargeAttack,
      characters_count: minCharacterCount,
      weapons_count: minWeaponCount,
      summons_count: minSummonCount,
      button_count: maxButtonsCount,
      turn_count: maxTurnsCount,
      name_quality: nameQuality,
      user_quality: userQuality,
      original: originalOnly,
    }

    console.log(filters)

    setCookie('filters', filters, { path: '/' })
    // openChange()
  }

  function resetFilters() {
    setFullAuto(props.defaultFilterSet.full_auto)
    setAutoGuard(props.defaultFilterSet.auto_guard)
    setChargeAttack(props.defaultFilterSet.charge_attack)
    setMinCharacterCount(props.defaultFilterSet.characters_count)
    setMinWeaponCount(props.defaultFilterSet.weapons_count)
    setMinSummonCount(props.defaultFilterSet.summons_count)
    setMaxButtonsCount(props.defaultFilterSet.button_count)
    setMaxTurnsCount(props.defaultFilterSet.turn_count)
    setUserQuality(props.defaultFilterSet.user_quality)
    setNameQuality(props.defaultFilterSet.name_quality)
    setOriginalOnly(props.defaultFilterSet.original)
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
