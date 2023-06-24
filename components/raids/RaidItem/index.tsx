import React, { ComponentProps, PropsWithChildren } from 'react'
import { useTranslation } from 'next-i18next'
import { CommandItem } from '~components/common/Command'
import classNames from 'classnames'
import styles from './index.module.scss'

interface Props extends ComponentProps<'div'> {
  className?: string
  icon?: {
    alt: string
    src: string
  }
  extra: boolean
  selected: boolean
  tabIndex?: number
  value: string | number
  onSelect: () => void
  onArrowKeyPressed?: (direction: 'Up' | 'Down') => void
  onEscapeKeyPressed?: () => void
}
const RaidItem = React.forwardRef<HTMLDivElement, PropsWithChildren<Props>>(
  function Item(
    {
      icon,
      value,
      extra,
      selected,
      tabIndex,
      children,
      onEscapeKeyPressed,
      onArrowKeyPressed,
      ...props
    }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    const { t } = useTranslation('common')

    const classes = classNames(
      { SelectItem: true, Raid: true },
      props.className
    )

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape' && onEscapeKeyPressed) {
        event.preventDefault()
        onEscapeKeyPressed()
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault()
        if (onArrowKeyPressed) {
          onArrowKeyPressed(event.key === 'ArrowUp' ? 'Up' : 'Down')
        }
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        props.onSelect()
      }
    }

    return (
      <CommandItem
        {...props}
        className={classes}
        tabIndex={tabIndex}
        value={`${value}`}
        onClick={props.onSelect}
        onKeyDown={handleKeyDown}
        ref={forwardedRef}
      >
        {icon ? <img alt={icon.alt} src={icon.src} /> : ''}
        <span className="Text">{children}</span>
        {selected ? <i className="Selected">{t('combobox.selected')}</i> : ''}
        {extra ? <i className="ExtraIndicator">EX</i> : ''}
      </CommandItem>
    )
  }
)

RaidItem.defaultProps = {
  extra: false,
  selected: false,
}

export default RaidItem
