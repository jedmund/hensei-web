'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { getCookie } from 'cookies-next'
import { useTranslations } from 'next-intl'

import { Dialog } from '~components/common/Dialog'
import DialogContent from '~components/common/DialogContent'
import DialogFooter from '~components/common/DialogFooter'
import Button from '~components/common/Button'
import Overlay from '~components/common/Overlay'

import { appState } from '~utils/appState'

import styles from './index.module.scss'

interface Props {
  open: boolean
  incomingCharacter?: Character
  conflictingCharacters?: GridCharacter[]
  desiredPosition: number
  resolveConflict: () => void
  resetConflict: () => void
}

const CharacterConflictModal = (props: Props) => {
  // Localization
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('common')
  const routerLocale = getCookie('NEXT_LOCALE')
  const locale =
    routerLocale && ['en', 'ja'].includes(routerLocale) ? routerLocale : 'en'

  // States
  const [open, setOpen] = useState(false)

  // Refs
  const footerRef = React.createRef<HTMLDivElement>()

  useEffect(() => {
    setOpen(props.open)
  }, [setOpen, props.open])

  function imageUrl(character?: Character, uncap: number = 0) {
    // Change the image based on the uncap level
    let suffix = '01'
    if (uncap == 6) suffix = '04'
    else if (uncap == 5) suffix = '03'
    else if (uncap > 2) suffix = '02'

    // Special casing for Lyria (and Young Cat eventually)
    if (character?.granblue_id === '3030182000') {
      let element = 1
      if (
        appState.grid.weapons.mainWeapon &&
        appState.grid.weapons.mainWeapon.element
      ) {
        element = appState.grid.weapons.mainWeapon.element
      } else if (appState.party.element != 0) {
        element = appState.party.element
      }

      suffix = `${suffix}_0${element}`
    }

    return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/character-square/${character?.granblue_id}_${suffix}.jpg`
  }

  function openChange(open: boolean) {
    setOpen(open)
    props.resetConflict()
  }

  function close() {
    setOpen(false)
    props.resetConflict()
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogContent
        className="conflict"
        footerRef={footerRef}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={close}
      >
        <div className={styles.content}>
          <p>
            {t.rich('modals.conflict.character', {
              strong: (chunks) => <strong>{chunks}</strong>
            })}
          </p>
          <div className={styles.diagram}>
            <ul>
              {props.conflictingCharacters?.map((character, i) => (
                <li className={styles.character} key={`conflict-${i}`}>
                  <img
                    alt={character.object.name[locale]}
                    src={imageUrl(character.object, character.uncap_level)}
                  />
                  <span>{character.object.name[locale]}</span>
                </li>
              ))}
            </ul>
            <span className={styles.arrow}>&rarr;</span>
            <div className={styles.wrapper}>
              <div className={styles.character}>
                <img
                  alt={props.incomingCharacter?.name[locale]}
                  src={imageUrl(props.incomingCharacter)}
                />
                <span>{props.incomingCharacter?.name[locale]}</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter
          rightElements={[
            <Button
              bound={true}
              onClick={close}
              key="cancel"
              text={t('buttons.cancel')}
            />,
            <Button
              bound={true}
              onClick={props.resolveConflict}
              key="confirm"
              text={t('modals.conflict.buttons.confirm')}
            />,
          ]}
        />
      </DialogContent>
      <Overlay open={open} visible={true} />
    </Dialog>
  )
}

export default CharacterConflictModal
