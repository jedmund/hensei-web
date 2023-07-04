import React, { useEffect } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import classNames from 'classnames'
import debounce from 'lodash.debounce'

import Overlay from '~components/common/Overlay'
import styles from './index.module.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.DialogHTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  headerref?: React.RefObject<HTMLDivElement>
  footerref?: React.RefObject<HTMLDivElement>
  scrollable?: boolean
  onEscapeKeyDown: (event: KeyboardEvent) => void
  onOpenAutoFocus: (event: Event) => void
}

const DialogContent = React.forwardRef<HTMLDivElement, Props>(function Dialog(
  { scrollable, children, ...props },
  forwardedRef
) {
  // Classes
  const classes = classNames(
    {
      [styles.dialogContent]: true,
    },
    props.className?.split(' ').map((className) => styles[className])
  )

  // Handlers
  function handleScroll(event: React.UIEvent<HTMLDivElement, UIEvent>) {
    const scrollTop = event.currentTarget.scrollTop
    const scrollHeight = event.currentTarget.scrollHeight
    const clientHeight = event.currentTarget.clientHeight

    if (props.headerref && props.headerref.current)
      manipulateHeaderShadow(props.headerref.current, scrollTop)

    if (props.footerref && props.footerref.current)
      manipulateFooterShadow(
        props.footerref.current,
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
    const footer = props.footerref

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

  return (
    <DialogPrimitive.Portal>
      <dialog className={styles.dialog}>
        <DialogPrimitive.Content
          {...props}
          className={classes}
          onOpenAutoFocus={props.onOpenAutoFocus}
          onEscapeKeyDown={props.onEscapeKeyDown}
          ref={forwardedRef}
        >
          <div
            className={classNames({
              [styles.container]: true,
              [styles.scrollable]: scrollable,
            })}
            onScroll={handleScroll}
          >
            {children}
          </div>
        </DialogPrimitive.Content>
      </dialog>
      <Overlay visible={true} open={true} />
    </DialogPrimitive.Portal>
  )
})

DialogContent.defaultProps = {
  scrollable: true,
}

export default DialogContent
