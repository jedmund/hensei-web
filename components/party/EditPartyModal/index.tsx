import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import debounce from 'lodash.debounce'

import { Dialog, DialogTrigger } from '~components/common/Dialog'
import DialogHeader from '~components/common/DialogHeader'
import DialogFooter from '~components/common/DialogFooter'
import DialogContent from '~components/common/DialogContent'
import Button from '~components/common/Button'
import DurationInput from '~components/common/DurationInput'
import InputTableField from '~components/common/InputTableField'
import RaidCombobox from '~components/raids/RaidCombobox'
import SegmentedControl from '~components/common/SegmentedControl'
import Segment from '~components/common/Segment'
import SwitchTableField from '~components/common/SwitchTableField'
import TableField from '~components/common/TableField'
import Textarea from '~components/common/Textarea'

import type { DetailsObject } from 'types'
import type { DialogProps } from '@radix-ui/react-dialog'

import { appState } from '~utils/appState'

import CheckIcon from '~public/icons/Check.svg'
import styles from './index.module.scss'
import Input from '~components/common/Input'

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
  const topContainerRef = React.createRef<HTMLDivElement>()
  const footerRef = React.createRef<HTMLDivElement>()
  const descriptionInput = useRef<HTMLDivElement>(null)

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

  // Classes
  const fieldsClasses = classNames({
    [styles.fields]: true,
    [styles.scrollable]: currentSegment === 1,
  })

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

  function handleTextAreaChanged(event: React.ChangeEvent<HTMLDivElement>) {
    event.preventDefault()
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

  // Handlers
  function handleScroll(event: React.UIEvent<HTMLDivElement, UIEvent>) {
    const scrollTop = event.currentTarget.scrollTop
    const scrollHeight = event.currentTarget.scrollHeight
    const clientHeight = event.currentTarget.clientHeight

    if (topContainerRef && topContainerRef.current)
      manipulateHeaderShadow(topContainerRef.current, scrollTop)

    if (footerRef && footerRef.current)
      manipulateFooterShadow(
        footerRef.current,
        scrollTop,
        scrollHeight,
        clientHeight
      )
  }

  function manipulateHeaderShadow(header: HTMLDivElement, scrollTop: number) {
    const boxShadowBase = '0 2px 8px'
    const maxValue = 50

    if (scrollTop >= 0) {
      const input = scrollTop > maxValue ? maxValue : scrollTop

      const boxShadowOpacity = mapRange(input, 0, maxValue, 0.0, 0.16)
      const borderOpacity = mapRange(input, 0, maxValue, 0.0, 0.24)

      header.style.boxShadow = `${boxShadowBase} rgba(0, 0, 0, ${boxShadowOpacity})`
      header.style.borderBottomColor = `rgba(0, 0, 0, ${borderOpacity})`
    }
  }

  function manipulateFooterShadow(
    footer: HTMLDivElement,
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number
  ) {
    const boxShadowBase = '0 -2px 8px'
    const minValue = scrollHeight - 200
    const currentScroll = scrollTop + clientHeight

    if (currentScroll >= minValue) {
      const input = currentScroll < minValue ? minValue : currentScroll

      const boxShadowOpacity = mapRange(
        input,
        minValue,
        scrollHeight,
        0.16,
        0.0
      )
      const borderOpacity = mapRange(input, minValue, scrollHeight, 0.24, 0.0)

      footer.style.boxShadow = `${boxShadowBase} rgba(0, 0, 0, ${boxShadowOpacity})`
      footer.style.borderTopColor = `rgba(0, 0, 0, ${borderOpacity})`
    }
  }

  const calculateFooterShadow = debounce(() => {
    const boxShadowBase = '0 -2px 8px'
    const scrollable = document.querySelector(`.${styles.scrollValue}`)
    const footer = footerRef

    if (footer && footer.current) {
      if (scrollable && scrollable.clientHeight >= scrollable.scrollHeight) {
        footer.current.style.boxShadow = `${boxShadowBase} rgba(0, 0, 0, 0)`
        footer.current.style.borderTopColor = `rgba(0, 0, 0, 0)`
      } else {
        footer.current.style.boxShadow = `${boxShadowBase} rgba(0, 0, 0, 0.16)`
        footer.current.style.borderTopColor = `rgba(0, 0, 0, 0.24)`
      }
    }
  }, 100)

  useEffect(() => {
    window.addEventListener('resize', calculateFooterShadow)
    calculateFooterShadow()

    return () => {
      window.removeEventListener('resize', calculateFooterShadow)
    }
  }, [calculateFooterShadow])

  function mapRange(
    value: number,
    low1: number,
    high1: number,
    low2: number,
    high2: number
  ) {
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1)
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
    const descriptionValue = descriptionInput.current?.innerHTML
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
  const segmentedControl = (
    <nav className={styles.segmentedControlWrapper} ref={topContainerRef}>
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
    </nav>
  )

  const nameField = (
    <Input
      name="name"
      placeholder="Name your team"
      autoFocus={true}
      value={name}
      maxLength={50}
      bound={true}
      showCounter={true}
      onChange={handleInputChange}
    />
  )

  const raidField = (
    <RaidCombobox
      showAllRaidsOption={false}
      currentRaid={raid}
      onChange={receiveRaid}
    />
  )

  const extraNotice = () => {
    if (extra) {
      return (
        <div className={styles.extraNotice}>
          <p>
            {raid && raid.group.guidebooks
              ? t('modals.edit_team.extra_notice_guidebooks')
              : t('modals.edit_team.extra_notice')}
          </p>
        </div>
      )
    }
  }

  const descriptionField = (
    <Textarea
      className="editParty"
      bound={true}
      placeholder={t('modals.edit_team.placeholders.description')}
      value={description}
      onInput={handleTextAreaChanged}
      ref={descriptionInput}
    />
  )

  const chargeAttackField = (
    <SwitchTableField
      name="charge_attack"
      label={t('modals.edit_team.labels.charge_attack')}
      value={chargeAttack}
      onValueChange={handleChargeAttackChanged}
    />
  )

  const fullAutoField = (
    <SwitchTableField
      name="full_auto"
      label={t('modals.edit_team.labels.full_auto')}
      value={fullAuto}
      onValueChange={handleFullAutoChanged}
    />
  )

  const autoGuardField = (
    <SwitchTableField
      name="auto_guard"
      label={t('modals.edit_team.labels.auto_guard')}
      value={autoGuard}
      onValueChange={handleAutoGuardChanged}
    />
  )

  const autoSummonField = (
    <SwitchTableField
      name="auto_summon"
      label={t('modals.edit_team.labels.auto_summon')}
      value={autoSummon}
      onValueChange={handleAutoSummonChanged}
    />
  )

  const extraField = (
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

  const clearTimeField = (
    <TableField
      name="clear_time"
      label={t('modals.edit_team.labels.clear_time')}
    >
      <DurationInput
        name="clear_time"
        bound={true}
        value={clearTime}
        onValueChange={(value: number) => handleClearTimeChanged(value)}
      />
    </TableField>
  )

  const turnCountField = (
    <InputTableField
      name="turn_count"
      className="number"
      label={t('modals.edit_team.labels.turn_count')}
      placeholder="0"
      type="number"
      value={turnCount}
      onValueChange={handleTurnCountChanged}
    />
  )

  const buttonCountField = (
    <InputTableField
      name="button_count"
      className="number"
      label={t('modals.edit_team.labels.button_count')}
      placeholder="0"
      type="number"
      value={buttonCount}
      onValueChange={handleButtonCountChanged}
    />
  )

  const chainCountField = (
    <InputTableField
      name="chain_count"
      className="number"
      label={t('modals.edit_team.labels.chain_count')}
      placeholder="0"
      type="number"
      value={chainCount}
      onValueChange={handleChainCountChanged}
    />
  )

  const infoPage = (
    <>
      {nameField}
      {raidField}
      {extraNotice()}
      {descriptionField}
    </>
  )

  const propertiesPage = (
    <>
      {chargeAttackField}
      {fullAutoField}
      {autoSummonField}
      {autoGuardField}
      {extraField}
      {clearTimeField}
      {turnCountField}
      {buttonCountField}
      {chainCountField}
    </>
  )

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent
        className="editParty"
        headerref={topContainerRef}
        footerref={footerRef}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <DialogHeader title={t('modals.edit_team.title')} ref={headerRef} />

        <div className={styles.content}>
          {segmentedControl}
          <div className={fieldsClasses} onScroll={handleScroll}>
            {currentSegment === 0 && infoPage}
            {currentSegment === 1 && propertiesPage}
          </div>
        </div>

        <DialogFooter
          ref={footerRef}
          rightElements={[
            <Button
              bound={true}
              key="cancel"
              text={t('buttons.cancel')}
              onClick={openChange}
            />,
            <Button
              bound={true}
              key="confirm"
              rightAccessoryIcon={<CheckIcon />}
              text={t('modals.edit_team.buttons.confirm')}
              onClick={updateDetails}
            />,
          ]}
        />
      </DialogContent>
    </Dialog>
  )
}

export default EditPartyModal
