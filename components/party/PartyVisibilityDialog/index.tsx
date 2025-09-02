import React, { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'react-i18next'
import debounce from 'lodash.debounce'

import * as RadioGroup from '@radix-ui/react-radio-group'
import Alert from '~components/common/Alert'
import Button from '~components/common/Button'
import { Dialog, DialogTrigger } from '~components/common/Dialog'
import DialogHeader from '~components/common/DialogHeader'
import DialogFooter from '~components/common/DialogFooter'
import DialogContent from '~components/common/DialogContent'

import type { DetailsObject } from '~types'
import type { DialogProps } from '@radix-ui/react-dialog'

import { appState } from '~utils/appState'

import styles from './index.module.scss'

interface Props extends DialogProps {
  open: boolean
  value: 1 | 2 | 3
  onOpenChange?: (open: boolean) => void
  updateParty: (details: DetailsObject) => Promise<any>
}

const EditPartyModal = ({
  open,
  value,
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
  const radioItemRef = [
    React.createRef<HTMLButtonElement>(),
    React.createRef<HTMLButtonElement>(),
    React.createRef<HTMLButtonElement>(),
  ]

  // States: Component
  const [alertOpen, setAlertOpen] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({
    name: '',
    description: '',
  })

  // States: Data
  const [visibility, setVisibility] = useState(1)

  // Hooks
  useEffect(() => {
    setVisibility(party.visibility)
  }, [value])

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
    setVisibility(party.visibility)
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
  function handleValueChange(value: string) {
    const newVisibility = parseInt(value)
    setVisibility(newVisibility)
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
    return visibility !== party.visibility
  }

  // Methods: Data methods
  async function updateDetails(event: React.MouseEvent) {
    const details: DetailsObject = {
      visibility: visibility,
    }

    await updateParty(details)
    if (onOpenChange) onOpenChange(false)
  }

  // Methods: Rendering methods
  function renderRadioItem(value: string, label: string) {
    return (
      <div className={styles.radioSet}>
        <RadioGroup.Item
          className={styles.radioItem}
          value={value}
          id={label}
          tabIndex={parseInt(value)}
          ref={radioItemRef[parseInt(value)]}
        >
          <RadioGroup.Indicator className={styles.radioIndicator} />
        </RadioGroup.Item>
        <label htmlFor={label}>
          <h4>{t(`modals.team_visibility.options.${label}`)}</h4>
          <p>{t(`modals.team_visibility.descriptions.${label}`)}</p>
        </label>
      </div>
    )
  }

  const confirmationAlert = (
    <Alert
      message={t('modals.team_visibility.alerts.unsaved_changes.message')}
      open={alertOpen}
      primaryActionText={t(
        'modals.team_visibility.alerts.unsaved_changes.buttons.confirm'
      )}
      primaryAction={close}
      cancelActionText={t(
        'modals.team_visibility.alerts.unsaved_changes.buttons.cancel'
      )}
      cancelAction={() => setAlertOpen(false)}
    />
  )

  return (
    <>
      {confirmationAlert}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{props.children}</DialogTrigger>
        <DialogContent
          className="changeVisibility"
          onEscapeKeyDown={onEscapeKeyDown}
          onOpenAutoFocus={onOpenAutoFocus}
        >
          <DialogHeader
            title={t('modals.team_visibility.title')}
            ref={headerRef}
          />

          <div className={styles.content}>
            <p className={styles.description}>
              {t('modals.team_visibility.description')}
            </p>
            <RadioGroup.Root
              className={styles.radioGroup}
              defaultValue={`${visibility}`}
              aria-label={t('modals.team_visibility.label')}
              onValueChange={handleValueChange}
            >
              {renderRadioItem('1', 'public')}
              {renderRadioItem('2', 'unlisted')}
              {renderRadioItem('3', 'private')}
            </RadioGroup.Root>
          </div>

          <DialogFooter
            ref={footerRef}
            rightElements={[
              <Button
                bound={true}
                onClick={() => onOpenChange && onOpenChange(false)}
                key="cancel"
                text={t('buttons.cancel')}
              />,
              <Button
                bound={true}
                key="confirm"
                onClick={updateDetails}
                text={t('modals.team_visibility.buttons.confirm')}
              />,
            ]}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EditPartyModal
