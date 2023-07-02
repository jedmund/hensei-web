import React, { ComponentProps, PropsWithChildren } from 'react'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'
import { CommandItem } from '~components/common/Command'
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

    const classes = classNames({
      raid: true,
      [styles.item]: true,
    })

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
        {icon && <img alt={icon.alt} src={icon.src} />}
        <span className={styles.text}>{children}</span>
        {selected && (
          <i className={styles.selected}>{t('combobox.selected')}</i>
        )}
        {extra && <i className={styles.extraIndicator}>EX</i>}
      </CommandItem>
    )
  }
)

RaidItem.defaultProps = {
  extra: false,
  selected: false,
}

export default RaidItem
