import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from '~components/common/Dialog'
import DialogContent from '~components/common/DialogContent'
import Button from '~components/common/Button'
import CharLimitedFieldset from '~components/common/CharLimitedFieldset'
import DurationInput from '~components/common/DurationInput'
import InputTableField from '~components/common/InputTableField'
import RaidCombobox from '~components/raids/RaidCombobox'
import SegmentedControl from '~components/common/SegmentedControl'
import Segment from '~components/common/Segment'
import SwitchTableField from '~components/common/SwitchTableField'
import TableField from '~components/common/TableField'

import type { DetailsObject } from 'types'
import type { DialogProps } from '@radix-ui/react-dialog'

import { appState } from '~utils/appState'

import CheckIcon from '~public/icons/Check.svg'
import CrossIcon from '~public/icons/Cross.svg'
import styles from './index.module.scss'

interface Props extends DialogProps {
  party?: Party
  updateCallback: (details: DetailsObject) => void
}

const EditPartyModal = ({ updateCallback, ...props }: Props) => {
  // Set up router
  const router = useRouter()

  // Set up translation
  const { t } = useTranslation('common')

  // Set up reactive state
  const { party } = useSnapshot(appState)

  // Refs
  const headerRef = React.createRef<HTMLDivElement>()
  const footerRef = React.createRef<HTMLDivElement>()
  const descriptionInput = useRef<HTMLTextAreaElement>(null)

  // States: Component
  const [open, setOpen] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({
    name: '',
    description: '',
  })
  const [currentSegment, setCurrentSegment] = useState(0)

  // States: Data
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [raid, setRaid] = useState<Raid>()
  const [extra, setExtra] = useState(false)
  const [chargeAttack, setChargeAttack] = useState(true)
  const [fullAuto, setFullAuto] = useState(false)
  const [autoGuard, setAutoGuard] = useState(false)
  const [autoSummon, setAutoSummon] = useState(false)

  const [buttonCount, setButtonCount] = useState<number | undefined>(undefined)
  const [chainCount, setChainCount] = useState<number | undefined>(undefined)
  const [turnCount, setTurnCount] = useState<number | undefined>(undefined)
  const [clearTime, setClearTime] = useState(0)

  // Hooks
  useEffect(() => {
    persistFromState()
  }, [party])

  // Methods: Event handlers (Dialog)
  function openChange() {
    if (open) {
      setOpen(false)
      setCurrentSegment(0)
      persistFromState()
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

  // Methods: Event handlers (Fields)
  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault()

    const { name, value } = event.target
    setName(value)

    let newErrors = errors
    setErrors(newErrors)
  }

  function handleChargeAttackChanged(checked: boolean) {
    setChargeAttack(checked)
  }

  function handleFullAutoChanged(checked: boolean) {
    setFullAuto(checked)
  }

  function handleAutoGuardChanged(checked: boolean) {
    setAutoGuard(checked)
  }

  function handleAutoSummonChanged(checked: boolean) {
    setAutoSummon(checked)
  }

  function handleExtraChanged(checked: boolean) {
    setExtra(checked)
  }

  function handleClearTimeChanged(value: number) {
    if (!isNaN(value)) setClearTime(value)
  }

  function handleTurnCountChanged(value?: string) {
    if (!value) return
    const numericalValue = parseInt(value)
    if (!isNaN(numericalValue)) setTurnCount(numericalValue)
  }

  function handleButtonCountChanged(value?: string) {
    if (!value) return
    const numericalValue = parseInt(value)
    if (!isNaN(numericalValue)) setButtonCount(numericalValue)
  }

  function handleChainCountChanged(value?: string) {
    if (!value) return
    const numericalValue = parseInt(value)
    if (!isNaN(numericalValue)) setChainCount(numericalValue)
  }

  function handleTextAreaChanged(
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    event.preventDefault()

    const { name, value } = event.target
    let newErrors = errors

    setErrors(newErrors)
  }

  function receiveRaid(raid?: Raid) {
    if (raid) {
      setRaid(raid)

      if (raid.group.extra) setExtra(true)
      else setExtra(false)
    }
  }

  // Methods: Data methods
  function persistFromState() {
    if (!party) return
    setName(party.name ? party.name : '')
    setDescription(party.description ? party.description : '')
    setRaid(party.raid)
    setAutoGuard(party.autoGuard)
    setAutoSummon(party.autoSummon)
    setFullAuto(party.fullAuto)
    setChargeAttack(party.chargeAttack)
    setClearTime(party.clearTime)
    if (party.turnCount) setTurnCount(party.turnCount)
    if (party.buttonCount) setButtonCount(party.buttonCount)
    if (party.chainCount) setChainCount(party.chainCount)
  }

  function updateDetails(event: React.MouseEvent) {
    const descriptionValue = descriptionInput.current?.value
    const details: DetailsObject = {
      fullAuto: fullAuto,
      autoGuard: autoGuard,
      autoSummon: autoSummon,
      chargeAttack: chargeAttack,
      clearTime: clearTime,
      buttonCount: buttonCount,
      turnCount: turnCount,
      chainCount: chainCount,
      name: name,
      description: descriptionValue,
      raid: raid,
      extra: extra,
    }

    updateCallback(details)
    openChange()
  }

  // Methods: Rendering methods
  const segmentedControl = () => {
    return (
      <SegmentedControl blended={true}>
        <Segment
          groupName="edit_nav"
          name="core"
          selected={currentSegment === 0}
          tabIndex={0}
          onClick={() => setCurrentSegment(0)}
        >
          {t('modals.edit_team.segments.basic_info')}
        </Segment>
        <Segment
          groupName="edit_nav"
          name="properties"
          selected={currentSegment === 1}
          tabIndex={0}
          onClick={() => setCurrentSegment(1)}
        >
          {t('modals.edit_team.segments.properties')}
        </Segment>
      </SegmentedControl>
    )
  }

  const nameField = () => {
    return (
      <CharLimitedFieldset
        className="Bound"
        fieldName="name"
        placeholder="Name your team"
        value={name}
        limit={50}
        onChange={handleInputChange}
        error={errors.name}
      />
    )
  }

  const raidField = () => {
    return (
      <RaidCombobox
        showAllRaidsOption={false}
        currentRaid={raid}
        onChange={receiveRaid}
      />
    )
  }

  const extraNotice = () => {
    if (extra) {
      return (
        <div className="ExtraNotice">
          <span className="ExtraNoticeText">
            {raid && raid.group.guidebooks
              ? t('modals.edit_team.extra_notice_guidebooks')
              : t('modals.edit_team.extra_notice')}
          </span>
        </div>
      )
    }
  }

  const descriptionField = () => {
    return (
      <div className="DescriptionField">
        <textarea
          className="Input Bound"
          name="description"
          placeholder={
            'Write your notes here\n\n\nWatch out for the 50% trigger!\nMake sure to click Fediel’s 3 first\nGood luck with RNG!'
          }
          onChange={handleTextAreaChanged}
          ref={descriptionInput}
          defaultValue={description}
        />
      </div>
    )
  }

  const chargeAttackField = () => {
    return (
      <SwitchTableField
        name="charge_attack"
        label={t('modals.edit_team.labels.charge_attack')}
        value={chargeAttack}
        onValueChange={handleChargeAttackChanged}
      />
    )
  }

  const fullAutoField = () => {
    return (
      <SwitchTableField
        name="full_auto"
        label={t('modals.edit_team.labels.full_auto')}
        value={fullAuto}
        onValueChange={handleFullAutoChanged}
      />
    )
  }

  const autoGuardField = () => {
    return (
      <SwitchTableField
        name="auto_guard"
        label={t('modals.edit_team.labels.auto_guard')}
        value={autoGuard}
        onValueChange={handleAutoGuardChanged}
      />
    )
  }

  const autoSummonField = () => {
    return (
      <SwitchTableField
        name="auto_summon"
        label={t('modals.edit_team.labels.auto_summon')}
        value={autoSummon}
        onValueChange={handleAutoSummonChanged}
      />
    )
  }

  const extraField = () => {
    return (
      <SwitchTableField
        name="extra"
        className="Extra"
        label={t('modals.edit_team.labels.extra')}
        description={t('modals.edit_team.descriptions.extra')}
        value={extra}
        disabled={true}
        onValueChange={handleExtraChanged}
      />
    )
  }

  const clearTimeField = () => {
    return (
      <TableField
        className="Numeric"
        name="clear_time"
        label={t('modals.edit_team.labels.clear_time')}
      >
        <DurationInput
          name="clear_time"
          className="Bound"
          value={clearTime}
          onValueChange={(value: number) => handleClearTimeChanged(value)}
        />
      </TableField>
    )
  }

  const turnCountField = () => {
    return (
      <InputTableField
        name="turn_count"
        className="Numeric"
        label={t('modals.edit_team.labels.turn_count')}
        placeholder="0"
        type="number"
        value={turnCount}
        onValueChange={handleTurnCountChanged}
      />
    )
  }

  const buttonCountField = () => {
    return (
      <InputTableField
        name="button_count"
        className="Numeric"
        label={t('modals.edit_team.labels.button_count')}
        placeholder="0"
        type="number"
        value={buttonCount}
        onValueChange={handleButtonCountChanged}
      />
    )
  }

  const chainCountField = () => {
    return (
      <InputTableField
        name="chain_count"
        className="Numeric"
        label={t('modals.edit_team.labels.chain_count')}
        placeholder="0"
        type="number"
        value={chainCount}
        onValueChange={handleChainCountChanged}
      />
    )
  }

  const infoPage = () => {
    return (
      <>
        {nameField()}
        {raidField()}
        {extraNotice()}
        {descriptionField()}
      </>
    )
  }

  const propertiesPage = () => {
    return (
      <>
        {chargeAttackField()}
        {fullAutoField()}
        {autoSummonField()}
        {autoGuardField()}
        {extraField()}
        {clearTimeField()}
        {turnCountField()}
        {buttonCountField()}
        {chainCountField()}
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent
        className="EditTeam"
        headerref={headerRef}
        footerref={footerRef}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <div className="DialogHeader" ref={headerRef}>
          <div className="DialogTop">
            <DialogTitle className="DialogTitle">
              {t('modals.edit_team.title')}
            </DialogTitle>
          </div>
          <DialogClose className="DialogClose" asChild>
            <span>
              <CrossIcon />
            </span>
          </DialogClose>
        </div>

        <div className="Content">
          {segmentedControl()}
          <div className="Fields">
            {currentSegment === 0 && infoPage()}
            {currentSegment === 1 && propertiesPage()}
          </div>
        </div>
        <div className="DialogFooter" ref={footerRef}>
          <div className="Left"></div>
          <div className="Right Buttons Spaced">
            <Button
              contained={true}
              text={t('buttons.cancel')}
              onClick={openChange}
            />
            <Button
              contained={true}
              rightAccessoryIcon={<CheckIcon />}
              text={t('modals.edit_team.buttons.confirm')}
              onClick={updateDetails}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditPartyModal
