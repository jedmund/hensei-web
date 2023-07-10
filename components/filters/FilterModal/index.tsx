import React, { useEffect, useState } from 'react'
import { getCookie, setCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'react-i18next'

import { Dialog, DialogTrigger } from '~components/common/Dialog'
import DialogHeader from '~components/common/DialogHeader'
import DialogFooter from '~components/common/DialogFooter'
import DialogContent from '~components/common/DialogContent'

import Button from '~components/common/Button'
import InputTableField from '~components/common/InputTableField'
import SelectTableField from '~components/common/SelectTableField'
import SliderTableField from '~components/common/SliderTableField'
import SwitchTableField from '~components/common/SwitchTableField'
import SelectItem from '~components/common/SelectItem'

import type { DialogProps } from '@radix-ui/react-dialog'

import styles from './index.module.scss'
import MentionTableField from '~components/common/MentionTableField'

interface Props extends DialogProps {
  defaultFilterSet: FilterSet
  filterSet: FilterSet
  persistFilters?: boolean
  sendAdvancedFilters: (filters: FilterSet) => void
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
  const [chargeAttackOpen, setChargeAttackOpen] = useState(false)
  const [fullAutoOpen, setFullAutoOpen] = useState(false)
  const [autoGuardOpen, setAutoGuardOpen] = useState(false)
  const [inclusions, setInclusions] = useState<string[]>([])
  const [exclusions, setExclusions] = useState<string[]>([])
  const [filterSet, setFilterSet] = useState<FilterSet>({})

  // Filter states
  const [fullAuto, setFullAuto] = useState(props.defaultFilterSet.full_auto)
  const [autoGuard, setAutoGuard] = useState(props.defaultFilterSet.auto_guard)
  const [chargeAttack, setChargeAttack] = useState(
    props.defaultFilterSet.charge_attack
  )
  const [minCharacterCount, setMinCharacterCount] = useState(
    props.defaultFilterSet.characters_count
  )
  const [minWeaponCount, setMinWeaponCount] = useState(
    props.defaultFilterSet.weapons_count
  )
  const [minSummonCount, setMinSummonCount] = useState(
    props.defaultFilterSet.summons_count
  )
  const [maxButtonsCount, setMaxButtonsCount] = useState(
    props.defaultFilterSet.button_count
  )
  const [maxTurnsCount, setMaxTurnsCount] = useState(
    props.defaultFilterSet.turn_count
  )
  const [userQuality, setUserQuality] = useState(
    props.defaultFilterSet.user_quality
  )
  const [nameQuality, setNameQuality] = useState(
    props.defaultFilterSet.name_quality
  )
  const [originalOnly, setOriginalOnly] = useState(
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

  function openSelect(name: 'charge_attack' | 'full_auto' | 'auto_guard') {
    setChargeAttackOpen(name === 'charge_attack' ? !chargeAttackOpen : false)
    setFullAutoOpen(name === 'full_auto' ? !fullAutoOpen : false)
    setAutoGuardOpen(name === 'auto_guard' ? !autoGuardOpen : false)
  }

  function saveFilters() {
    const filters: FilterSet = {}
    filters.full_auto = fullAuto
    filters.auto_guard = autoGuard
    filters.charge_attack = chargeAttack
    filters.characters_count = minCharacterCount
    filters.weapons_count = minWeaponCount
    filters.summons_count = minSummonCount
    filters.name_quality = nameQuality
    filters.user_quality = userQuality
    filters.original = originalOnly

    if (maxButtonsCount) filters.button_count = maxButtonsCount
    if (maxTurnsCount) filters.turn_count = maxTurnsCount

    if (props.persistFilters) {
      setCookie('filters', filters, { path: '/' })
    }

    if (inclusions.length > 0) filters.includes = inclusions.join(',')
    if (exclusions.length > 0) filters.excludes = exclusions.join(',')

    props.sendAdvancedFilters(filters)
    openChange()
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
  function handleChargeAttackValueChange(value: string) {
    setChargeAttack(parseInt(value))
  }

  function handleFullAutoValueChange(value: string) {
    const newValue = parseInt(value)
    setFullAuto(newValue)
    if (newValue === 0 || (newValue === -1 && autoGuard === 1))
      setAutoGuard(newValue)
  }

  function handleAutoGuardValueChange(value: string) {
    const newValue = parseInt(value)
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

  function handleMaxButtonsCountValueChange(
    value?: string | number | readonly string[]
  ) {
    if (!value) return
    setMaxButtonsCount(value as number)
  }

  function handleMaxTurnsCountValueChange(
    value?: string | number | readonly string[]
  ) {
    if (!value) return
    setMaxTurnsCount(value as number)
  }

  function handleNameQualityValueChange(value?: boolean) {
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
    <SelectTableField
      name="full_auto"
      label={t('modals.filters.labels.full_auto')}
      open={fullAutoOpen}
      value={`${fullAuto}`}
      onOpenChange={() => openSelect('full_auto')}
      onClose={() => setFullAutoOpen(false)}
      onChange={handleFullAutoValueChange}
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
    </SelectTableField>
  )

  const autoGuardField = () => (
    <SelectTableField
      name="auto_guard"
      label={t('modals.filters.labels.auto_guard')}
      open={autoGuardOpen}
      value={`${autoGuard}`}
      onOpenChange={() => openSelect('auto_guard')}
      onClose={() => setAutoGuardOpen(false)}
      onChange={handleAutoGuardValueChange}
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
    </SelectTableField>
  )

  const chargeAttackField = () => (
    <SelectTableField
      name="charge_attack"
      label={t('modals.filters.labels.charge_attack')}
      open={chargeAttackOpen}
      value={`${chargeAttack}`}
      onOpenChange={() => openSelect('charge_attack')}
      onClose={() => setChargeAttackOpen(false)}
      onChange={handleChargeAttackValueChange}
      autoFocus={true}
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
    </SelectTableField>
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

  // Inclusions and exclusions
  const inclusionField = (
    <MentionTableField
      name="inclusion"
      description={t('modals.filters.descriptions.inclusion')}
      placeholder={t('modals.filters.placeholders.included')}
      label={t('modals.filters.labels.inclusion')}
      onUpdate={(value) => setInclusions(value)}
    />
  )

  const exclusionField = (
    <MentionTableField
      name="exclusion"
      description={t('modals.filters.descriptions.exclusion')}
      placeholder={t('modals.filters.placeholders.excluded')}
      label={t('modals.filters.labels.exclusion')}
      onUpdate={(value) => setExclusions(value)}
    />
  )

  const filterNotice = () => {
    if (props.persistFilters) return null
    return (
      <div className={styles.notice}>
        <p>
          <Trans i18nKey="modals.filters.notice">
            Filters set on <strong>user profiles</strong> and in{' '}
            <strong>Your saved teams</strong> will not be saved
          </Trans>
        </p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent
        className="filter"
        wrapperClassName="filter"
        headerRef={headerRef}
        footerRef={footerRef}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <DialogHeader title={t('modals.filters.title')} />
        <div className={styles.fields}>
          {filterNotice()}
          {inclusionField}
          {exclusionField}
          {chargeAttackField()}
          {fullAutoField()}
          {autoGuardField()}
          {/* {maxButtonsField()} */}
          {/* {maxTurnsField()} */}
          {minCharactersField()}
          {minSummonsField()}
          {minWeaponsField()}
          {nameQualityField()}
          {userQualityField()}
          {originalOnlyField()}
        </div>
        <DialogFooter
          ref={footerRef}
          rightElements={[
            <Button
              blended={true}
              key="clear"
              text={t('modals.filters.buttons.clear')}
              onClick={resetFilters}
            />,
            <Button
              bound={true}
              key="confirm"
              text={t('modals.filters.buttons.confirm')}
              onClick={saveFilters}
            />,
          ]}
        />
      </DialogContent>
    </Dialog>
  )
}

FilterModal.defaultProps = {
  persistFilters: true,
}

export default FilterModal
