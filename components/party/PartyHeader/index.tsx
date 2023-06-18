import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import Button from '~components/common/Button'
import Tooltip from '~components/common/Tooltip'
import Token from '~components/common/Token'

import EditPartyModal from '~components/party/EditPartyModal'
import PartyDropdown from '~components/party/PartyDropdown'

import { accountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'
import { formatTimeAgo } from '~utils/timeAgo'

import EditIcon from '~public/icons/Edit.svg'
import RemixIcon from '~public/icons/Remix.svg'
import SaveIcon from '~public/icons/Save.svg'

import type { DetailsObject } from 'types'

import './index.scss'
import api from '~utils/api'

// Props
interface Props {
  party?: Party
  new: boolean
  editable: boolean
  deleteCallback: () => void
  remixCallback: () => void
  updateCallback: (details: DetailsObject) => void
}

const PartyHeader = (props: Props) => {
  const { party } = useSnapshot(appState)

  const { t } = useTranslation('common')
  const router = useRouter()
  const locale = router.locale || 'en'

  const { party: partySnapshot } = useSnapshot(appState)

  const [name, setName] = useState('')

  const [chargeAttack, setChargeAttack] = useState(true)
  const [fullAuto, setFullAuto] = useState(false)
  const [autoGuard, setAutoGuard] = useState(false)

  const [buttonCount, setButtonCount] = useState<number | undefined>(undefined)
  const [chainCount, setChainCount] = useState<number | undefined>(undefined)
  const [turnCount, setTurnCount] = useState<number | undefined>(undefined)
  const [clearTime, setClearTime] = useState(0)

  const classes = classNames({
    PartyDetails: true,
    ReadOnly: true,
  })

  const userClass = classNames({
    user: true,
    empty: !party.user,
  })

  const linkClass = classNames({
    wind: party && party.element == 1,
    fire: party && party.element == 2,
    water: party && party.element == 3,
    earth: party && party.element == 4,
    dark: party && party.element == 5,
    light: party && party.element == 6,
  })

  useEffect(() => {
    if (props.party) {
      setName(props.party.name)
      setAutoGuard(props.party.auto_guard)
      setFullAuto(props.party.full_auto)
      setChargeAttack(props.party.charge_attack)
      setClearTime(props.party.clear_time)
      if (props.party.turn_count) setTurnCount(props.party.turn_count)
      if (props.party.button_count) setButtonCount(props.party.button_count)
      if (props.party.chain_count) setChainCount(props.party.chain_count)
    }
  }, [props.party])

  // Subscribe to router changes and reset state
  // if the new route is a new team
  useEffect(() => {
    router.events.on('routeChangeStart', (url, { shallow }) => {
      if (url === '/new' || url === '/') {
        const party = initialAppState.party

        setName(party.name ? party.name : '')
        setAutoGuard(party.autoGuard)
        setFullAuto(party.fullAuto)
        setChargeAttack(party.chargeAttack)
        setClearTime(party.clearTime)
        setTurnCount(party.turnCount)
        setButtonCount(party.buttonCount)
        setChainCount(party.chainCount)
      }
    })
  }, [])

  // Actions: Favorites
  function toggleFavorite() {
    if (appState.party.favorited) unsaveFavorite()
    else saveFavorite()
  }

  function saveFavorite() {
    if (appState.party.id)
      api.saveTeam({ id: appState.party.id }).then((response) => {
        if (response.status == 201) appState.party.favorited = true
      })
    else console.error('Failed to save team: No party ID')
  }

  function unsaveFavorite() {
    if (appState.party.id)
      api.unsaveTeam({ id: appState.party.id }).then((response) => {
        if (response.status == 200) appState.party.favorited = false
      })
    else console.error('Failed to unsave team: No party ID')
  }

  // Methods: Navigation
  function goTo(shortcode?: string) {
    if (shortcode) router.push(`/p/${shortcode}`)
  }

  const userImage = (picture?: string, element?: string) => {
    if (picture && element)
      return (
        <img
          alt={picture}
          className={`profile ${element}`}
          srcSet={`/profile/${picture}.png,
                            /profile/${picture}@2x.png 2x`}
          src={`/profile/${picture}.png`}
        />
      )
    else
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

  const userBlock = (username?: string, picture?: string, element?: string) => {
    return (
      <div className={userClass}>
        {userImage(picture, element)}
        {username ? username : t('no_user')}
      </div>
    )
  }

  const renderUserBlock = () => {
    let username, picture, element
    if (accountState.account.authorized && props.new) {
      username = accountState.account.user?.username
      picture = accountState.account.user?.avatar.picture
      element = accountState.account.user?.avatar.element
    } else if (party.user && !props.new) {
      username = party.user.username
      picture = party.user.avatar.picture
      element = party.user.avatar.element
    }

    if (username && picture && element) {
      return linkedUserBlock(username, picture, element)
    } else if (!props.new) {
      return userBlock()
    }
  }

  const linkedUserBlock = (
    username?: string,
    picture?: string,
    element?: string
  ) => {
    return (
      <div>
        <Link href={`/${username}`} passHref>
          <a className={linkClass}>{userBlock(username, picture, element)}</a>
        </Link>
      </div>
    )
  }

  const linkedRaidBlock = (raid: Raid) => {
    return (
      <div>
        <Link href={`/teams?raid=${raid.slug}`} passHref>
          <a className={`Raid ${linkClass}`}>{raid.name[locale]}</a>
        </Link>
      </div>
    )
  }

  // Render: Tokens
  const chargeAttackToken = (
    <Token
      className={classNames({
        ChargeAttack: true,
        On: chargeAttack,
        Off: !chargeAttack,
      })}
    >
      {`${t('party.details.labels.charge_attack')} ${
        chargeAttack ? 'On' : 'Off'
      }`}
    </Token>
  )

  const fullAutoToken = (
    <Token
      className={classNames({
        FullAuto: true,
        On: fullAuto,
        Off: !fullAuto,
      })}
    >
      {`${t('party.details.labels.full_auto')} ${fullAuto ? 'On' : 'Off'}`}
    </Token>
  )

  const autoGuardToken = (
    <Token
      className={classNames({
        AutoGuard: true,
        On: autoGuard,
        Off: !autoGuard,
      })}
    >
      {`${t('party.details.labels.auto_guard')} ${autoGuard ? 'On' : 'Off'}`}
    </Token>
  )

  const turnCountToken = (
    <Token>
      {t('party.details.turns.with_count', {
        count: turnCount,
      })}
    </Token>
  )

  const buttonChainToken = () => {
    if (buttonCount || chainCount) {
      let string = ''

      if (buttonCount && buttonCount > 0) {
        string += `${buttonCount}b`
      }

      if (!buttonCount && chainCount && chainCount > 0) {
        string += `0${t('party.details.suffix.buttons')}${chainCount}${t(
          'party.details.suffix.chains'
        )}`
      } else if (buttonCount && chainCount && chainCount > 0) {
        string += `${chainCount}${t('party.details.suffix.chains')}`
      } else if (buttonCount && !chainCount) {
        string += `0${t('party.details.suffix.chains')}`
      }

      return <Token>{string}</Token>
    }
  }

  const clearTimeToken = () => {
    const minutes = Math.floor(clearTime / 60)
    const seconds = clearTime - minutes * 60

    let string = ''
    if (minutes > 0)
      string = `${minutes}${t('party.details.suffix.minutes')} ${seconds}${t(
        'party.details.suffix.seconds'
      )}`
    else string = `${seconds}${t('party.details.suffix.seconds')}`

    return <Token>{string}</Token>
  }

  function renderTokens() {
    return (
      <section className="Tokens">
        {chargeAttackToken}
        {fullAutoToken}
        {autoGuardToken}
        {turnCount ? turnCountToken : ''}
        {clearTime > 0 ? clearTimeToken() : ''}
        {buttonChainToken()}
      </section>
    )
  }

  // Render: Buttons
  const saveButton = () => {
    return (
      <Tooltip content={t('tooltips.save')}>
        <Button
          leftAccessoryIcon={<SaveIcon />}
          className={classNames({
            Save: true,
            Saved: partySnapshot.favorited,
          })}
          text={
            appState.party.favorited ? t('buttons.saved') : t('buttons.save')
          }
          onClick={toggleFavorite}
        />
      </Tooltip>
    )
  }

  const remixButton = () => {
    return (
      <Tooltip content={t('tooltips.remix')}>
        <Button
          leftAccessoryIcon={<RemixIcon />}
          className="Remix"
          text={t('buttons.remix')}
          onClick={props.remixCallback}
        />
      </Tooltip>
    )
  }

  return (
    <>
      <section className="DetailsWrapper">
        <div className="PartyInfo">
          <div className="Left">
            <div className="Header">
              <h1 className={name ? '' : 'empty'}>
                {name ? name : t('no_title')}
              </h1>
              {party.remix && party.sourceParty ? (
                <Tooltip content={t('tooltips.source')}>
                  <Button
                    className="IconButton Blended"
                    leftAccessoryIcon={<RemixIcon />}
                    text={t('tokens.remix')}
                    onClick={() => goTo(party.sourceParty?.shortcode)}
                  />
                </Tooltip>
              ) : (
                ''
              )}
            </div>
            <div className="attribution">
              {renderUserBlock()}
              {appState.party.raid ? linkedRaidBlock(appState.party.raid) : ''}
              {party.created_at != '' ? (
                <time
                  className="last-updated"
                  dateTime={new Date(party.created_at).toString()}
                >
                  {formatTimeAgo(new Date(party.created_at), locale)}
                </time>
              ) : (
                ''
              )}
            </div>
          </div>
          {party.editable ? (
            <div className="Right">
              <EditPartyModal
                party={props.party}
                updateCallback={props.updateCallback}
              >
                <Button
                  leftAccessoryIcon={<EditIcon />}
                  text={t('buttons.show_info')}
                />
              </EditPartyModal>
              <PartyDropdown
                editable={props.editable}
                deleteTeamCallback={props.deleteCallback}
                remixTeamCallback={props.remixCallback}
              />
            </div>
          ) : (
            <div className="Right">
              {saveButton()}
              {remixButton()}
            </div>
          )}
        </div>
        <section className={classes}>{renderTokens()}</section>
      </section>
    </>
  )
}

export default PartyHeader
