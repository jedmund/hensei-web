import React from 'react'
import { useTranslation } from 'next-i18next'
import * as Dialog from '@radix-ui/react-dialog'

import CrossIcon from '~public/icons/Cross.svg'

import './index.scss'

const ChangelogModal = () => {
  const { t } = useTranslation('common')

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <li className="MenuItem">
          <span>{t('modals.changelog.title')}</span>
        </li>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          className="Dialog"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="DialogHeader">
            <Dialog.Title className="DialogTitle">
              {t('menu.changelog')}
            </Dialog.Title>
            <Dialog.Close className="DialogClose" asChild>
              <span>
                <CrossIcon />
              </span>
            </Dialog.Close>
          </div>

          <section>
            <Dialog.Description className="DialogDescription">
              <h3 className="version">1.0</h3>
              <ul className="notes">
                <li>First release!</li>
                <li>Content update - Mid-December 2022 Flash Gala</li>
                <li>You can embed Youtube videos now</li>
                <li>Better clicking - right-click and open in a new tab</li>
                <li>Manually set dark mode in Account Settings</li>
                <li>Lots of bugs squashed</li>
              </ul>
            </Dialog.Description>
          </section>
        </Dialog.Content>
        <Dialog.Overlay className="Overlay" />
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default ChangelogModal
