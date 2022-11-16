import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useSnapshot } from "valtio"
import { useTranslation } from "next-i18next"
import classNames from "classnames"

import { accountState } from "~utils/accountState"
import { formatTimeAgo } from "~utils/timeAgo"

import Button from "~components/Button"
import { ButtonType } from "~utils/enums"

import "./index.scss"

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
  const { t } = useTranslation("common")
  const locale =
    router.locale && ["en", "ja"].includes(router.locale) ? router.locale : "en"

  const [mainhand, setMainhand] = useState<Weapon>()
  const [weapons, setWeapons] = useState<GridArray<Weapon>>({})

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

    for (const [key, value] of Object.entries(props.grid)) {
      if (value.position == -1) setMainhand(value.object)
      else if (!value.mainhand && value.position != null)
        newWeapons[value.position] = value.object
    }

    setWeapons(newWeapons)
  }, [props.grid])

  function navigate() {
    props.onClick(props.shortcode)
  }

  function generateMainhandImage() {
    let url = ""

    if (mainhand) {
      if (mainhand.element == 0 && props.grid[0].element) {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${mainhand.granblue_id}_${props.grid[0].element}.jpg`
      } else {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${mainhand.granblue_id}.jpg`
      }
    }

    return mainhand && props.grid[0] ? (
      <img alt={mainhand.name[locale]} src={url} />
    ) : (
      ""
    )
  }

  function generateGridImage(position: number) {
    let url = ""

    if (weapons[position]) {
      if (weapons[position].element == 0 && props.grid[position].element) {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapons[position]?.granblue_id}_${props.grid[position].element}.jpg`
      } else {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapons[position]?.granblue_id}.jpg`
      }
    }

    return weapons[position] ? (
      <img alt={weapons[position].name[locale]} src={url} />
    ) : (
      ""
    )
  }

  function sendSaveData() {
    if (props.onSave) props.onSave(props.id, props.favorited)
  }

  const userImage = () => {
    if (props.user)
      return (
        <img
          alt={props.user.picture.picture}
          className={`profile ${props.user.picture.element}`}
          srcSet={`/profile/${props.user.picture.picture}.png,
                            /profile/${props.user.picture.picture}@2x.png 2x`}
          src={`/profile/${props.user.picture.picture}.png`}
        />
      )
    else return <div className="no-user" />
  }

  const details = (
    <div className="Details">
      <h2 className={titleClass} onClick={navigate}>
        {props.name ? props.name : t("no_title")}
      </h2>
      <div className="bottom">
        <div className={raidClass}>
          {props.raid ? props.raid.name[locale] : t("no_raid")}
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
          <h2 className={titleClass} onClick={navigate}>
            {props.name ? props.name : t("no_title")}
          </h2>
          <div className={raidClass}>
            {props.raid ? props.raid.name[locale] : t("no_raid")}
          </div>
        </div>
        {account.authorized &&
        ((props.user && account.user && account.user.id !== props.user.id) ||
          !props.user) ? (
          <Button
            active={props.favorited}
            icon="save"
            type={ButtonType.IconOnly}
            onClick={sendSaveData}
          />
        ) : (
          ""
        )}
      </div>
      <div className="bottom">
        <div className={userClass}>
          {userImage()}
          {props.user ? props.user.username : t("no_user")}
        </div>
        <time className="last-updated" dateTime={props.createdAt.toISOString()}>
          {formatTimeAgo(props.createdAt, locale)}
        </time>
      </div>
    </div>
  )

  return (
    <div className="GridRep">
      {props.displayUser ? detailsWithUsername : details}
      <div className="Grid" onClick={navigate}>
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
    </div>
  )
}

export default GridRep
