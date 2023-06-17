import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as RadixSelect from '@radix-ui/react-select'
import classNames from 'classnames'

import Overlay from '~components/common/Overlay'

import ChevronIcon from '~public/icons/Chevron.svg'

import './index.scss'
import SegmentedControl from '~components/common/SegmentedControl'
import Segment from '~components/common/Segment'
import Input from '~components/common/Input'

// Props
interface Props
  extends React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  > {
  altText?: string
  currentSegment: number
  iconSrc?: string
  open: boolean
  trigger?: React.ReactNode
  children?: React.ReactNode
  onOpenChange?: () => void
  onValueChange?: (value: string) => void
  onSegmentClick: (segment: number) => void
  onClose?: () => void
  triggerClass?: string
  overlayVisible?: boolean
}

const RaidSelect = React.forwardRef<HTMLButtonElement, Props>(function Select(
  props: Props,
  forwardedRef
) {
  // Import translations
  const { t } = useTranslation('common')

  const searchInput = React.createRef<HTMLInputElement>()

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [query, setQuery] = useState('')

  const triggerClasses = classNames(
    {
      SelectTrigger: true,
      Disabled: props.disabled,
    },
    props.triggerClass
  )

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  useEffect(() => {
    if (props.value && props.value !== '') setValue(`${props.value}`)
    else setValue('')
  }, [props.value])

  function onValueChange(newValue: string) {
    setValue(`${newValue}`)
    if (props.onValueChange) props.onValueChange(newValue)
  }

  function onCloseAutoFocus() {
    setOpen(false)
    if (props.onClose) props.onClose()
  }

  function onEscapeKeyDown() {
    setOpen(false)
    if (props.onClose) props.onClose()
  }

  function onPointerDownOutside() {
    setOpen(false)
    if (props.onClose) props.onClose()
  }

  return (
    <RadixSelect.Root
      open={open}
      value={value !== '' ? value : undefined}
      onValueChange={onValueChange}
      onOpenChange={props.onOpenChange}
    >
      <RadixSelect.Trigger
        className={triggerClasses}
        placeholder={props.placeholder}
        ref={forwardedRef}
      >
        {props.iconSrc ? <img alt={props.altText} src={props.iconSrc} /> : ''}
        <RadixSelect.Value placeholder={props.placeholder} />
        {!props.disabled ? (
          <RadixSelect.Icon className="SelectIcon">
            <ChevronIcon />
          </RadixSelect.Icon>
        ) : (
          ''
        )}
      </RadixSelect.Trigger>

      <RadixSelect.Portal className="Select">
        <>
          <Overlay
            open={open}
            visible={props.overlayVisible != null ? props.overlayVisible : true}
          />

          <RadixSelect.Content
            className="Raid Select"
            onCloseAutoFocus={onCloseAutoFocus}
            onEscapeKeyDown={onEscapeKeyDown}
            onPointerDownOutside={onPointerDownOutside}
          >
            <div className="Top">
              <Input
                autoComplete="off"
                className="Search Bound"
                name="query"
                placeholder={t('search.placeholders.raid')}
                ref={searchInput}
                value={query}
                onChange={() => {}}
              />
              <SegmentedControl blended={true}>
                <Segment
                  groupName="raid_section"
                  name="events"
                  selected={props.currentSegment === 1}
                  onClick={() => props.onSegmentClick(1)}
                >
                  {t('raids.sections.events')}
                </Segment>
                <Segment
                  groupName="raid_section"
                  name="raids"
                  selected={props.currentSegment === 0}
                  onClick={() => props.onSegmentClick(0)}
                >
                  {t('raids.sections.raids')}
                </Segment>
                <Segment
                  groupName="raid_section"
                  name="solo"
                  selected={props.currentSegment === 2}
                  onClick={() => props.onSegmentClick(2)}
                >
                  {t('raids.sections.solo')}
                </Segment>
              </SegmentedControl>
            </div>
            <RadixSelect.Viewport>{props.children}</RadixSelect.Viewport>
          </RadixSelect.Content>
        </>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
})

RaidSelect.defaultProps = {
  overlayVisible: true,
}

export default RaidSelect
