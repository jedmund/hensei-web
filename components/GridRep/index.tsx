import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'
import 'fix-date'

import { accountState } from '~utils/accountState'
import { formatTimeAgo } from '~utils/timeAgo'
import { ElementMap } from '~utils/elements'
import { mapToGridArray } from '~utils/mapToGridArray'

import Button from '~components/common/Button'

import SaveIcon from '~public/icons/Save.svg'
import ShieldIcon from '~public/icons/Shield.svg'
import styles from './index.module.scss'

interface Props {
  shortcode: string
  id: string
  name: string
  raid: Raid | null
  weapons: {
    mainWeapon: GridWeapon | null
    allWeapons: GridArray<GridWeapon> | null
  } | null
  user: User | null
  fullAuto: boolean
  autoGuard: boolean
  favorited: boolean
  createdAt: Date
  onClick: (shortcode: string) => void
  onSave?: (partyId: string, favorited: boolean) => void
}

const GridRep = (props: Props) => {
  const numWeapons: number = 9

  const { account } = useSnapshot(accountState)

  const router = useRouter()
  const { t } = useTranslation('common')
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const [mainhand, setMainhand] = useState<Weapon>()
  const [weapons, setWeapons] = useState<GridArray<Weapon>>({})
  const [grid, setGrid] = useState<GridArray<GridWeapon>>({})

  const titleClass = classNames({
    empty: !props.name,
  })

  const raidClass = classNames({
    [styles.raid]: true,
    [styles.empty]: !props.raid,
  })

  const userClass = classNames({
    [styles.user]: true,
    [styles.empty]: !props.user,
  })

  const mainhandClasses = classNames({
    [styles.weapon]: true,
    [styles.mainhand]: true,
  })

  const weaponClasses = classNames({
    [styles.weapon]: true,
    [styles.grid]: true,
  })

  useEffect(() => {
    if (props.weapons && props.weapons.mainWeapon) {
      setMainhand(props.weapons.mainWeapon?.object)
    }

    if (props.weapons && props.weapons.allWeapons) {
      setWeapons(
        mapToGridArray(
          Object.values(props.weapons.allWeapons).map((w) => w?.object)
        )
      )
      setGrid(props.weapons.allWeapons)
    }
  }, [props.weapons])

  function navigate() {
    props.onClick(props.shortcode)
  }

  function generateMainhandImage() {
    let url = ''

    if (mainhand) {
      const weapon = props.weapons?.mainWeapon

      if (mainhand.element === ElementMap.null && weapon && weapon.element) {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${mainhand.granblueId}_${weapon.element}.jpg`
      } else {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${mainhand.granblueId}.jpg`
      }
    }

    return mainhand && <img alt={mainhand.name[locale]} src={url} />
  }

  function generateGridImage(position: number) {
    let url = ''

    const weapon = weapons[position]
    const gridWeapon = grid[position]

    if (weapon && gridWeapon) {
      if (weapon.element === ElementMap.null && gridWeapon.element) {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblueId}_${gridWeapon.element}.jpg`
      } else {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblueId}.jpg`
      }
    }

    return (
      weapons[position] && (
        <img alt={weapons[position]?.name[locale]} src={url} />
      )
    )
  }

  function sendSaveData() {
    if (props.onSave) props.onSave(props.id, props.favorited)
  }

  const userImage = () => {
    if (props.user && props.user.avatar) {
      return (
        <img
          alt={props.user.avatar.picture}
          className={`profile ${props.user.avatar.element}`}
          srcSet={`/profile/${props.user.avatar.picture}.png,
                              /profile/${props.user.avatar.picture}@2x.png 2x`}
          src={`/profile/${props.user.avatar.picture}.png`}
        />
      )
    } else
      return (
        <img
          alt={t('no_user')}
          className={`profile anonymous`}
          srcSet={`/profile/npc.png,
                            /profile/npc@2x.png 2x`}
          src={`/profile/npc.png`}
        />
      )
  }

  const attribution = () => (
    <span className={userClass}>
      {userImage()}
      {props.user ? props.user.username : t('no_user')}
    </span>
  )

  function fullAutoString() {
    const fullAutoElement = (
      <span className={styles.fullAuto}>
        {` · ${t('party.details.labels.full_auto')}`}
      </span>
    )

    const autoGuardElement = (
      <span className={styles.autoGuard}>
        <ShieldIcon />
      </span>
    )

    return (
      <div className={styles.auto}>
        {fullAutoElement}
        {props.autoGuard ? autoGuardElement : ''}
      </div>
    )
  }

  const detailsWithUsername = (
    <div className={styles.details}>
      <div className={styles.top}>
        <div className={styles.info}>
          <h2 className={titleClass}>
            {props.name ? props.name : t('no_title')}
          </h2>
          <div className={styles.properties}>
            <span className={raidClass}>
              {props.raid ? props.raid.name[locale] : t('no_raid')}
            </span>
            {props.fullAuto && (
              <span className={styles.fullAuto}>
                {` · ${t('party.details.labels.full_auto')}`}
              </span>
            )}
            {props.raid && props.raid.group?.extra && (
              <span className={styles.extra}>{` · EX`}</span>
            )}
          </div>
        </div>
        {account.authorized &&
          ((props.user && account.user && account.user.id !== props.user.id) ||
            !props.user) && (
            <Link href="#">
              <Button
                className={classNames({
                  save: true,
                  saved: props.favorited,
                })}
                leftAccessoryIcon={<SaveIcon className="stroke" />}
                active={props.favorited}
                bound={true}
                size="small"
                onClick={sendSaveData}
              />
            </Link>
          )}
      </div>
      <div className={styles.attributed}>
        {attribution()}

        <time
          className={styles.lastUpdated}
          dateTime={props.createdAt.toISOString()}
        >
          {formatTimeAgo(props.createdAt, locale)}
        </time>
      </div>
    </div>
  )

  return (
    <Link href={`/p/${props.shortcode}`}>
      <a className={styles.gridRep}>
        {detailsWithUsername}
        <div className={styles.weaponGrid}>
          <div className={mainhandClasses}>{generateMainhandImage()}</div>

          <ul className={styles.weapons}>
            {Array.from(Array(numWeapons)).map((x, i) => {
              return (
                <li key={`${props.shortcode}-${i}`} className={weaponClasses}>
                  {generateGridImage(i)}
                </li>
              )
            })}
          </ul>
        </div>
      </a>
    </Link>
  )
}

export default GridRep
