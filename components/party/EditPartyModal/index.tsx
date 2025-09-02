import React, { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { Trans, useTranslation } from 'react-i18next'
import classNames from 'classnames'
import debounce from 'lodash.debounce'

import Alert from '~components/common/Alert'
import Button from '~components/common/Button'
import { Dialog, DialogTrigger } from '~components/common/Dialog'
import DialogHeader from '~components/common/DialogHeader'
import DialogFooter from '~components/common/DialogFooter'
import DialogContent from '~components/common/DialogContent'
import DurationInput from '~components/common/DurationInput'
import Editor from '~components/common/Editor'
import Input from '~components/common/Input'
import InputTableField from '~components/common/InputTableField'
import RaidCombobox from '~components/raids/RaidCombobox'
import SegmentedControl from '~components/common/SegmentedControl'
import Segment from '~components/common/Segment'
import SwitchTableField from '~components/common/SwitchTableField'
import TableField from '~components/common/TableField'

import capitalizeFirstLetter from '~utils/capitalizeFirstLetter'
import type { DetailsObject } from '~types'
import type { DialogProps } from '@radix-ui/react-dialog'
import type { JSONContent } from '@tiptap/core'

import { appState } from '~utils/appState'

import CheckIcon from '~public/icons/Check.svg'
import styles from './index.module.scss'

interface Props extends DialogProps {
  open: boolean
  party?: Party
  raidGroups: RaidGroup[]
  onOpenChange?: (open: boolean) => void
  updateParty: (details: DetailsObject) => Promise<any>
}

const EditPartyModal = ({
  open,
  raidGroups,
  updateParty,
  onOpenChange,
  ...props
}: Props) => {
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
  const [alertOpen, setAlertOpen] = useState(false)
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
  function handleOpenChange() {
    if (hasBeenModified() && open) {
      setAlertOpen(true)
    } else if (!hasBeenModified() && open) {
      close()
    } else {
      if (onOpenChange) onOpenChange(true)
    }
  }

  function close() {
    setAlertOpen(false)
    setCurrentSegment(0)
    persistFromState()
    if (onOpenChange) onOpenChange(false)
  }

  function onEscapeKeyDown(event: KeyboardEvent) {
    event.preventDefault()
    handleOpenChange()
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

  function handleEditorUpdate(content: JSONContent) {
    setDescription(JSON.stringify(content))
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

  function handleTurnCountChanged(value?: string | number | readonly string[]) {
    if (value === null || value === undefined) return
    setTurnCount(value as number)
  }

  function handleButtonCountChanged(
    value?: string | number | readonly string[]
  ) {
    if (value === null || value === undefined) return
    setButtonCount(value as number)
  }

  function handleChainCountChanged(
    value?: string | number | readonly string[]
  ) {
    if (value === null || value === undefined) return
    setChainCount(value as number)
  }

  function handleTextAreaChanged(event: React.ChangeEvent<HTMLDivElement>) {
    event.preventDefault()
    setDescription(event.target.innerHTML)
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
    const scrollable = document.querySelector(`.${styles.scrollable}`)
    const footer = footerRef

    if (footer && footer.current) {
      if (scrollable) {
        if (scrollable.clientHeight >= scrollable.scrollHeight) {
          footer.current.style.boxShadow = `${boxShadowBase} rgba(0, 0, 0, 0)`
          footer.current.style.borderTopColor = `rgba(0, 0, 0, 0)`
        } else {
          footer.current.style.boxShadow = `${boxShadowBase} rgba(0, 0, 0, 0.16)`
          footer.current.style.borderTopColor = `rgba(0, 0, 0, 0.24)`
        }
      } else {
        footer.current.style.boxShadow = `${boxShadowBase} rgba(0, 0, 0, 0)`
        footer.current.style.borderTopColor = `rgba(0, 0, 0, 0)`
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

  // Methods: Modification checking
  function hasBeenModified() {
    const nameChanged =
      name !== party.name &&
      !(name === '' && (party.name === undefined || party.name === null))
    const descriptionChanged =
      description !== party.description &&
      !(description === '' && party.description === undefined)

    const raidChanged = raid !== party.raid
    const chargeAttackChanged = chargeAttack !== party.chargeAttack
    const fullAutoChanged = fullAuto !== party.fullAuto
    const autoGuardChanged = autoGuard !== party.autoGuard
    const autoSummonChanged = autoSummon !== party.autoSummon
    const clearTimeChanged = clearTime !== party.clearTime
    const turnCountChanged = turnCount !== party.turnCount
    const buttonCountChanged = buttonCount !== party.buttonCount
    const chainCountChanged = chainCount !== party.chainCount

    // Debugging for if you need to check if a value is being changed
    // console.log(`
    // nameChanged: ${nameChanged}\n
    // descriptionChanged: ${descriptionChanged}\n
    // raidChanged: ${raidChanged}\n
    // chargeAttackChanged: ${chargeAttackChanged}\n
    // fullAutoChanged: ${fullAutoChanged}\n
    // autoGuardChanged: ${autoGuardChanged}\n
    // autoSummonChanged: ${autoSummonChanged}\n
    // clearTimeChanged: ${clearTimeChanged}\n
    // turnCountChanged: ${turnCountChanged}\n
    // buttonCountChanged: ${buttonCountChanged}\n
    // chainCountChanged: ${chainCountChanged}\n
    // `)

    return (
      nameChanged ||
      descriptionChanged ||
      raidChanged ||
      chargeAttackChanged ||
      fullAutoChanged ||
      autoGuardChanged ||
      autoSummonChanged ||
      clearTimeChanged ||
      turnCountChanged ||
      buttonCountChanged ||
      chainCountChanged
    )
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
    if (party.turnCount !== undefined) setTurnCount(party.turnCount)
    if (party.buttonCount !== undefined) setButtonCount(party.buttonCount)
    if (party.chainCount !== undefined) setChainCount(party.chainCount)
  }

  async function updateDetails(event: React.MouseEvent) {
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
      description: description,
      raid: raid,
      extra: extra,
    }

    await updateParty(details)
    if (onOpenChange) onOpenChange(false)
  }

  // Methods: Rendering methods
  const confirmationAlert = (
    <Alert
      message={
        <span>
          <Trans i18nKey="alert.unsaved_changes.party">
            You will lose all changes to your party{' '}
            <strong>
              {{
                objectName: name || capitalizeFirstLetter(t('untitled')),
              }}
            </strong>{' '}
            if you continue.
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
      placeholder={t('modals.edit_team.placeholders.name')}
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
      raidGroups={raidGroups}
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

  const editorField = (
    <Editor
      bound={true}
      content={props.party?.description}
      editable={true}
      key={props.party?.shortcode}
      onUpdate={handleEditorUpdate}
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
      {editorField}
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
    <>
      {confirmationAlert}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{props.children}</DialogTrigger>
        <DialogContent
          className="editParty"
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
                onClick={handleOpenChange}
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
    </>
  )
}

export default EditPartyModal
