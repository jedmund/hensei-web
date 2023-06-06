import React, { ComponentProps, PropsWithChildren } from 'react'
import { CommandItem } from '~components/common/Command'

import './index.scss'
import classNames from 'classnames'

interface Props {
  className?: string
  icon?: {
    alt: string
    src: string
  }
  extra: boolean
  selected: boolean
  value: string | number
  onSelect: () => void
}
const RaidItem = React.forwardRef<HTMLDivElement, PropsWithChildren<Props>>(
  function Item(
    {
      icon,
      value,
      extra,
      selected,
      children,
      ...props
    }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    const classes = classNames(
      { SelectItem: true, Raid: true },
      props.className
    )

    return (
      <CommandItem
        {...props}
        className={classes}
        value={`${value}`}
        onClick={props.onSelect}
        ref={forwardedRef}
      >
        {icon ? <img alt={icon.alt} src={icon.src} /> : ''}
        <span className="Text">{children}</span>
        {selected ? <i className="Selected">Selected</i> : ''}
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
