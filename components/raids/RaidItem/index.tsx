import React, { ComponentProps, PropsWithChildren } from 'react'
import { useTranslations } from 'next-intl'
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

const placeholderSlugs = [
  'all',
  'farming',
  'three-gauge',
  'five-gauge',
  'ex-plus',
  'nm90',
  'nm95',
  'nm100',
  'nm150',
  'nm200',
  '1-star',
  '2-star',
  '3-star',
  '4-star',
  '5-star',
  'db95',
  'db135',
  'db175',
]
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
    const t = useTranslations('common')

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
        {placeholderSlugs.includes(`${value}`) ? (
          <div className={styles.placeholder} />
        ) : (
          icon && <img alt={icon.alt} src={icon.src} />
        )}
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
