import React, { useEffect, useState } from 'react'
import { getCookie, setCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from '~components/Dialog'
import DialogContent from '~components/DialogContent'
import Button from '~components/Button'

import type { DialogProps } from '@radix-ui/react-dialog'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

interface Props extends DialogProps {}

const FilterModal = (props: Props) => {
  // Set up router
  const router = useRouter()
  const locale = router.locale

  // Set up translation
  const { t } = useTranslation('common')

  // Refs
  const headerRef = React.createRef<HTMLDivElement>()
  const footerRef = React.createRef<HTMLDivElement>()

  // States
  const [filters, setFilters] = useState<{ [key: string]: any }>()
  const [open, setOpen] = useState(false)

  // Hooks
  useEffect(() => {
    if (props.open !== undefined) setOpen(props.open)
  })

  function sendFilters() {
    openChange()
  }

  function openChange() {
    if (open) {
      setOpen(false)
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

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent
        className="Search"
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <div className="DialogHeader" ref={headerRef}>
          <div className="DialogTop">
            <DialogTitle className="DialogTitle">
              {t('modals.filters.title')}
            </DialogTitle>
          </div>
          <DialogClose className="DialogClose" asChild>
            <span>
              <CrossIcon />
            </span>
          </DialogClose>
        </div>
        <form>
          <div className="Fields"></div>
          <div className="DialogFooter" ref={footerRef}>
            <div className="Buttons Spaced">
              <Button blended={true} text={t('modals.filters.buttons.clear')} />
              <Button
                contained={true}
                text={t('modals.filters.buttons.confirm')}
              />
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default FilterModal
