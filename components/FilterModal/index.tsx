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
import SliderTableField from '~components/SliderTableField'

import type { DialogProps } from '@radix-ui/react-dialog'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'
import SwitchTableField from '~components/SwitchTableField'
import InputTableField from '~components/InputTableField'

interface Props extends DialogProps {}

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
  const [filters, setFilters] = useState<{ [key: string]: any }>()
  const [open, setOpen] = useState(false)

  const [fullAuto, setFullAuto] = useState(false)
  const [autoGuard, setAutoGuard] = useState(false)
  const [chargeAttack, setChargeAttack] = useState(false)

  const [minCharacterCount, setMinCharacterCount] = useState(3)
  const [minWeaponCount, setMinWeaponCount] = useState(5)
  const [minSummonCount, setMinSummonCount] = useState(2)

  const [maxButtonsCount, setMaxButtonsCount] = useState(0)
  const [maxTurnsCount, setMaxTurnsCount] = useState(0)

  const [userQuality, setUserQuality] = useState(false)
  const [nameQuality, setNameQuality] = useState(false)
  const [originalOnly, setOriginalOnly] = useState(false)

  // Hooks
  useEffect(() => {
    if (props.open !== undefined) setOpen(props.open)
  })

  function sendFilters() {
    openChange()
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

  const minCharactersField = () => (
    <SliderTableField
      name="min_characters"
      description={t('modals.filters.descriptions.min_characters')}
      label={t('modals.filters.labels.min_characters')}
      value={minCharacterCount}
      min={0}
      max={MAX_CHARACTERS}
      step={1}
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
    />
  )

  const fullAutoField = () => (
    <SwitchTableField
      name="full_auto"
      label={t('modals.filters.labels.full_auto')}
      value={fullAuto}
    />
  )

  const autoGuardField = () => (
    <SwitchTableField
      name="auto_guard"
      label={t('modals.filters.labels.auto_guard')}
      value={autoGuard}
    />
  )

  const chargeAttackField = () => (
    <SwitchTableField
      name="charge_attack"
      label={t('modals.filters.labels.charge_attack')}
      value={chargeAttack}
    />
  )

  const nameQualityField = () => (
    <SwitchTableField
      name="name_quality"
      label={t('modals.filters.labels.name_quality')}
      value={nameQuality}
    />
  )

  const userQualityField = () => (
    <SwitchTableField
      name="user_quality"
      label={t('modals.filters.labels.user_quality')}
      value={userQuality}
    />
  )

  const originalOnlyField = () => (
    <SwitchTableField
      name="original_only"
      label={t('modals.filters.labels.original_only')}
      value={originalOnly}
    />
  )

  const maxButtonsField = () => (
    <InputTableField
      name="min_characters"
      description={t('modals.filters.descriptions.max_buttons')}
      label={t('modals.filters.labels.max_buttons')}
      value={maxButtonsCount}
    />
  )

  const maxTurnsField = () => (
    <InputTableField
      name="min_turns"
      description={t('modals.filters.descriptions.max_turns')}
      label={t('modals.filters.labels.max_turns')}
      value={maxTurnsCount}
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
        <form>
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
              <Button blended={true} text={t('modals.filters.buttons.clear')} />
              <Button
                contained={true}
                text={t('modals.filters.buttons.confirm')}
              />
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default FilterModal
