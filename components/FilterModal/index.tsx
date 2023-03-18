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
import SelectTableField from '~components/SelectTableField'
import SliderTableField from '~components/SliderTableField'
import SwitchTableField from '~components/SwitchTableField'
import SelectItem from '~components/SelectItem'

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
  const [chargeAttack, setChargeAttack] = useState(DEFAULT_CHARGE_ATTACK)

  const [minCharacterCount, setMinCharacterCount] = useState(3)
  const [minWeaponCount, setMinWeaponCount] = useState(5)
  const [minSummonCount, setMinSummonCount] = useState(2)

  const [maxButtonsCount, setMaxButtonsCount] = useState(0)
  const [maxTurnsCount, setMaxTurnsCount] = useState(0)

  // Filter states
  const [fullAuto, setFullAuto] = useState(props.defaultFilterSet.full_auto)
  const [autoGuard, setAutoGuard] = useState(props.defaultFilterSet.auto_guard)
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
  const [minSummonCount, setMinSummonCount] = useState(DEFAULT_MIN_SUMMONS)
    props.defaultFilterSet.summons_count

  const [maxButtonsCount, setMaxButtonsCount] = useState(
    props.filterSet.button_count
  )
  const [maxTurnsCount, setMaxTurnsCount] = useState(props.filterSet.turn_count)

  const [userQuality, setUserQuality] = useState(props.filterSet.user_quality)
    props.defaultFilterSet.user_quality
  )
  const [nameQuality, setNameQuality] = useState(props.filterSet.name_quality)
    props.defaultFilterSet.name_quality
  )
  const [originalOnly, setOriginalOnly] = useState(props.filterSet.original)
    props.defaultFilterSet.original
  )

  // Hooks
  useEffect(() => {
    if (props.open !== undefined) setOpen(props.open)
  })

  useEffect(() => {
    setFilterSet(props.filterSet)
  }, [props.filterSet])

  useEffect(() => {
    setFullAuto(filterSet.full_auto)
    setAutoGuard(filterSet.auto_guard)
    setChargeAttack(filterSet.charge_attack)

    setMinCharacterCount(filterSet.characters_count)
    setMinSummonCount(filterSet.summons_count)
    setMinWeaponCount(filterSet.weapons_count)

    setMaxButtonsCount(filterSet.button_count)
    setMaxTurnsCount(filterSet.turn_count)

    setNameQuality(filterSet.name_quality)
    setUserQuality(filterSet.user_quality)
    setOriginalOnly(filterSet.original)
  }, [filterSet])

  function sendFilters() {
    setChargeAttackOpen(name === 'charge_attack' ? !chargeAttackOpen : false)
    setFullAutoOpen(name === 'full_auto' ? !fullAutoOpen : false)
    setAutoGuardOpen(name === 'auto_guard' ? !autoGuardOpen : false)
  }

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
    if (maxTurnsCount) filters.turn_count = maxTurnsCount

    setCookie('filters', filters, { path: '/' })
    props.sendAdvancedFilters(filters)
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
    setFullAuto(newValue)
    if (newValue === 0 || (newValue === -1 && autoGuard === 1))
      setAutoGuard(newValue)
  }

  function handleAutoGuardValueChange(value: boolean) {
    setAutoGuard(value)
    setAutoGuard(newValue)
    if (newValue === 1 || (newValue === -1 && fullAuto === 0))
      setFullAuto(newValue)
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

  // Sliders
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

  // Selects
  const fullAutoField = () => (
    <SwitchTableField
      name="full_auto"
      label={t('modals.filters.labels.full_auto')}
      open={fullAutoOpen}
      value={fullAuto}
      onOpenChange={() => openSelect('full_auto')}
      onClose={() => setFullAutoOpen(false)}
      onValueChange={handleFullAutoValueChange}
    >
      <SelectItem key="on-off" value="-1">
        {t('modals.filters.options.on_and_off')}
      </SelectItem>
      <SelectItem key="on" value="1">
        {t('modals.filters.options.on')}
      </SelectItem>
      <SelectItem key="off" value="0">
        {t('modals.filters.options.off')}
      </SelectItem>
    />
  )

  const autoGuardField = () => (
    <SwitchTableField
      name="auto_guard"
      label={t('modals.filters.labels.auto_guard')}
      open={autoGuardOpen}
      value={autoGuard}
      onOpenChange={() => openSelect('auto_guard')}
      onClose={() => setAutoGuardOpen(false)}
      onValueChange={handleAutoGuardValueChange}
    >
      <SelectItem key="on-off" value="-1">
        {t('modals.filters.options.on_and_off')}
      </SelectItem>
      <SelectItem key="on" value="1">
        {t('modals.filters.options.on')}
      </SelectItem>
      <SelectItem key="off" value="0">
        {t('modals.filters.options.off')}
      </SelectItem>
    />
  )

  const chargeAttackField = () => (
    <SwitchTableField
      name="charge_attack"
      label={t('modals.filters.labels.charge_attack')}
      open={chargeAttackOpen}
      value={chargeAttack}
      onOpenChange={() => openSelect('charge_attack')}
      onClose={() => setChargeAttackOpen(false)}
      onValueChange={handleChargeAttackValueChange}
    >
      <SelectItem key="on-off" value="-1">
        {t('modals.filters.options.on_and_off')}
      </SelectItem>
      <SelectItem key="on" value="1">
        {t('modals.filters.options.on')}
      </SelectItem>
      <SelectItem key="off" value="0">
        {t('modals.filters.options.off')}
      </SelectItem>
    />
  )

  // Switches
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

  // Inputs
  const maxButtonsField = () => (
    <InputTableField
      name="min_characters"
      description={t('modals.filters.descriptions.max_buttons')}
      placeholder="0"
      label={t('modals.filters.labels.max_buttons')}
      value={maxButtonsCount}
      onValueChange={handleMaxButtonsCountValueChange}
    />
  )

  const maxTurnsField = () => (
    <InputTableField
      name="min_turns"
      description={t('modals.filters.descriptions.max_turns')}
      placeholder="0"
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
