import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'react-i18next'

import * as Dialog from '@radix-ui/react-dialog'
import Button from '~components/Button'

import mapWeaponSeries from '~utils/mapWeaponSeries'

import './index.scss'

interface Props {
  open: boolean
  incomingWeapon: Weapon
  conflictingWeapons: GridWeapon[]
  desiredPosition: number
  resolveConflict: () => void
  resetConflict: () => void
}

const WeaponConflictModal = (props: Props) => {
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

  function imageUrl(weapon?: Weapon) {
    return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-square/${weapon?.granblue_id}.jpg`
  }

  function openChange(open: boolean) {
    setOpen(open)
    props.resetConflict()
  }

  function close() {
    setOpen(false)
    props.resetConflict()
  }

  const infoString = () => {
    const series = props.incomingWeapon.series
    const seriesSlug = t(`series.${mapWeaponSeries(series)}`)

    return [2, 3].includes(series) ? (
      <Trans i18nKey="modals.conflict.weapon.opus-draconic"></Trans>
    ) : (
      <Trans i18nKey="modals.conflict.weapon.generic">
        Only one weapon from the
        <strong>{{ series: seriesSlug }} Series</strong> can be included in each
        party. Do you want to change your weapons?
      </Trans>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={openChange}>
      <Dialog.Portal>
        <Dialog.Content
          className="Conflict Dialog"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <p>{infoString()}</p>
          <div className="WeaponDiagram Diagram">
            <ul>
              {props.conflictingWeapons?.map((weapon, i) => (
                <li className="weapon" key={`conflict-${i}`}>
                  <img
                    alt={weapon.object.name[locale]}
                    src={imageUrl(weapon.object)}
                  />
                  <span>{weapon.object.name[locale]}</span>
                </li>
              ))}
            </ul>
            <span className="arrow">&rarr;</span>
            <div className="wrapper">
              <div className="weapon">
                <img
                  alt={props.incomingWeapon?.name[locale]}
                  src={imageUrl(props.incomingWeapon)}
                />
                {props.incomingWeapon?.name[locale]}
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
        </Dialog.Content>
        <Dialog.Overlay className="Overlay" />
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default WeaponConflictModal
