import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import { accountState } from '~utils/accountState'
import { formatTimeAgo } from '~utils/timeAgo'

import Button from '~components/Button'

import SaveIcon from '~public/icons/Save.svg'

import './index.scss'

interface Props {
  shortcode: string
  id: string
  name: string
  raid: Raid
  grid: GridWeapon[]
  user?: User
  favorited: boolean
  createdAt: Date
  displayUser?: boolean | false
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
    raid: true,
    empty: !props.raid,
  })

  const userClass = classNames({
    user: true,
    empty: !props.user,
  })

  useEffect(() => {
    const newWeapons = Array(numWeapons)
    const gridWeapons = Array(numWeapons)

    for (const [key, value] of Object.entries(props.grid)) {
      if (value.position == -1) setMainhand(value.object)
      else if (!value.mainhand && value.position != null) {
        newWeapons[value.position] = value.object
        gridWeapons[value.position] = value
      }
    }

    setWeapons(newWeapons)
    setGrid(gridWeapons)
  }, [props.grid])

  function navigate() {
    props.onClick(props.shortcode)
  }

  function generateMainhandImage() {
    let url = ''

    if (mainhand) {
      if (mainhand.element == 0 && props.grid[0] && props.grid[0].element) {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${mainhand.granblue_id}_${props.grid[0].element}.jpg`
      } else {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${mainhand.granblue_id}.jpg`
      }
    }

    return mainhand && props.grid[0] ? (
      <img alt={mainhand.name[locale]} src={url} />
    ) : (
      ''
    )
  }

  function generateGridImage(position: number) {
    let url = ''

    const weapon = weapons[position]
    const gridWeapon = grid[position]

    if (weapon && gridWeapon) {
      if (weapon.element == 0 && gridWeapon.element) {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}_${gridWeapon.element}.jpg`
      } else {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`
      }
    }

    return weapons[position] ? (
      <img alt={weapons[position]?.name[locale]} src={url} />
    ) : (
      ''
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
    } else return <div className="no-user" />
  }

  const linkedAttribution = () => (
    <Link href={`/${props.user ? props.user.username : '#'}`}>
      <a
        className={userClass}
        href={`/${props.user ? props.user.username : '#'}`}
      >
        {userImage()}
        {props.user ? props.user.username : t('no_user')}
      </a>
    </Link>
  )

  const unlinkedAttribution = () => (
    <div className={userClass}>
      {userImage()}
      {props.user ? props.user.username : t('no_user')}
    </div>
  )

  const details = (
    <div className="Details">
      <h2 className={titleClass}>{props.name ? props.name : t('no_title')}</h2>
      <div className="bottom">
        <div className={raidClass}>
          {props.raid ? props.raid.name[locale] : t('no_raid')}
        </div>
        <time className="last-updated" dateTime={props.createdAt.toISOString()}>
          {formatTimeAgo(props.createdAt, locale)}
        </time>
      </div>
    </div>
  )

  const detailsWithUsername = (
    <div className="Details">
      <div className="top">
        <div className="info">
          <h2 className={titleClass}>
            {props.name ? props.name : t('no_title')}
          </h2>
          <div className={raidClass}>
            {props.raid ? props.raid.name[locale] : t('no_raid')}
          </div>
        </div>
        {account.authorized &&
        ((props.user && account.user && account.user.id !== props.user.id) ||
          !props.user) ? (
          <Link href="#">
            <a href="#">
              <Button
                className="Save"
                accessoryIcon={<SaveIcon className="stroke" />}
                active={props.favorited}
                contained={true}
                buttonSize="small"
                onClick={sendSaveData}
              />
            </a>
          </Link>
        ) : (
          ''
        )}
      </div>
      <div className="bottom">
        {props.user ? linkedAttribution() : unlinkedAttribution()}

        <time className="last-updated" dateTime={props.createdAt.toISOString()}>
          {formatTimeAgo(props.createdAt, locale)}
        </time>
      </div>
    </div>
  )

  return (
    <Link href={`/p/${props.shortcode}`}>
      <a className="GridRep">
        {props.displayUser ? detailsWithUsername : details}
        <div className="Grid">
          <div className="weapon grid_mainhand">{generateMainhandImage()}</div>

          <ul className="grid_weapons">
            {Array.from(Array(numWeapons)).map((x, i) => {
              return (
                <li
                  key={`${props.shortcode}-${i}`}
                  className="weapon grid_weapon"
                >
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
