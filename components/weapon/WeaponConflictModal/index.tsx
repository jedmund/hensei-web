import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'react-i18next'

import { Dialog } from '~components/common/Dialog'
import DialogContent from '~components/common/DialogContent'
import DialogFooter from '~components/common/DialogFooter'
import Button from '~components/common/Button'
import Overlay from '~components/common/Overlay'

import mapWeaponSeries from '~utils/mapWeaponSeries'

import styles from './index.module.scss'

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

  // Refs
  const footerRef = React.createRef<HTMLDivElement>()

  useEffect(() => {
    setOpen(props.open)
  }, [setOpen, props.open])

  function imageUrl(weapon?: Weapon) {
    return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-square/${weapon?.granblueId}.jpg`
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
    <Dialog open={open} onOpenChange={openChange}>
      <DialogContent
        className="conflict"
        footerref={footerRef}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={close}
      >
        <div className={styles.content}>
          <p>{infoString()}</p>
          <div className={styles.diagram}>
            <ul>
              {props.conflictingWeapons?.map((weapon, i) => (
                <li className={styles.weapon} key={`conflict-${i}`}>
                  <img
                    alt={weapon.object.name[locale]}
                    src={imageUrl(weapon.object)}
                  />
                  <span>{weapon.object.name[locale]}</span>
                </li>
              ))}
            </ul>
            <span className={styles.arrow}>&rarr;</span>
            <div className={styles.wrapper}>
              <div className={styles.weapon}>
                <img
                  alt={props.incomingWeapon?.name[locale]}
                  src={imageUrl(props.incomingWeapon)}
                />
                {props.incomingWeapon?.name[locale]}
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
              key="confirm"
              onClick={props.resolveConflict}
              text={t('modals.conflict.buttons.confirm')}
            />,
          ]}
        />
      </DialogContent>
      <Overlay open={open} visible={true} />
    </Dialog>
  )
}

export default WeaponConflictModal
