import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'next-i18next'

import { Dialog } from '~components/Dialog'
import DialogContent from '~components/DialogContent'
import Button from '~components/Button'
import Overlay from '~components/Overlay'

import { appState } from '~utils/appState'

import './index.scss'

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
  const { t } = useTranslation('common')
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  // States
  const [open, setOpen] = useState(false)

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

    return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-square/${character?.granblue_id}_${suffix}.jpg`
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
        className="Conflict"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={close}
      >
        <p>
          <Trans i18nKey="modals.conflict.character"></Trans>
        </p>
        <div className="CharacterDiagram Diagram">
          <ul>
            {props.conflictingCharacters?.map((character, i) => (
              <li className="character" key={`conflict-${i}`}>
                <img
                  alt={character.object.name[locale]}
                  src={imageUrl(character.object, character.uncap_level)}
                />
                <span>{character.object.name[locale]}</span>
              </li>
            ))}
          </ul>
          <span className="arrow">&rarr;</span>
          <div className="wrapper">
            <div className="character">
              <img
                alt={props.incomingCharacter?.name[locale]}
                src={imageUrl(props.incomingCharacter)}
              />
              <span>{props.incomingCharacter?.name[locale]}</span>
            </div>
          </div>
        </div>
        <footer>
          <Button onClick={close} text={t('buttons.cancel')} />
          <Button
            onClick={props.resolveConflict}
            text={t('modals.conflict.buttons.confirm')}
          />
        </footer>
      </DialogContent>
      <Overlay open={open} visible={true} />
    </Dialog>
  )
}

export default CharacterConflictModal
