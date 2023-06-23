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

import api from '~utils/api'
import { accountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'
import { formatTimeAgo } from '~utils/timeAgo'

import EditIcon from '~public/icons/Edit.svg'
import RemixIcon from '~public/icons/Remix.svg'
import SaveIcon from '~public/icons/Save.svg'

import type { DetailsObject } from 'types'

import styles from './index.module.scss'
import RemixTeamAlert from '~components/dialogs/RemixTeamAlert'
import RemixedToast from '~components/toasts/RemixedToast'
import { set } from 'local-storage'

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

  // State: Component
  const [remixAlertOpen, setRemixAlertOpen] = useState(false)
  const [remixToastOpen, setRemixToastOpen] = useState(false)

  // State: Data
  const [name, setName] = useState('')
  const [chargeAttack, setChargeAttack] = useState(true)
  const [fullAuto, setFullAuto] = useState(false)
  const [autoGuard, setAutoGuard] = useState(false)
  const [autoSummon, setAutoSummon] = useState(false)
  const [buttonCount, setButtonCount] = useState<number | undefined>(undefined)
  const [chainCount, setChainCount] = useState<number | undefined>(undefined)
  const [turnCount, setTurnCount] = useState<number | undefined>(undefined)
  const [clearTime, setClearTime] = useState(0)

  const classes = classNames({
    PartyDetails: true,
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
      setAutoSummon(props.party.auto_summon)
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

  // Actions: Remix team
  function remixTeamCallback() {
    setRemixToastOpen(true)
    props.remixCallback()
  }

  // Alerts: Remix team
  function openRemixTeamAlert() {
    setRemixAlertOpen(true)
  }

  function handleRemixTeamAlertChange(open: boolean) {
    setRemixAlertOpen(open)
  }

  // Toasts: Remix team
  function handleRemixToastOpenChanged(open: boolean) {
    setRemixToastOpen(!open)
  }

  function handleRemixToastCloseClicked() {
    setRemixToastOpen(false)
  }

  // Rendering

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
        On: party.chargeAttack,
        Off: !party.chargeAttack,
      })}
    >
      {`${t('party.details.labels.charge_attack')} ${
        party.chargeAttack ? 'On' : 'Off'
      }`}
    </Token>
  )

  const fullAutoToken = (
    <Token
      className={classNames({
        FullAuto: true,
        On: party.fullAuto,
        Off: !party.fullAuto,
      })}
    >
      {`${t('party.details.labels.full_auto')} ${
        party.fullAuto ? 'On' : 'Off'
      }`}
    </Token>
  )

  const autoGuardToken = (
    <Token
      className={classNames({
        AutoGuard: true,
        On: party.autoGuard,
        Off: !party.autoGuard,
      })}
    >
      {`${t('party.details.labels.auto_guard')} ${
        party.autoGuard ? 'On' : 'Off'
      }`}
    </Token>
  )

  const autoSummonToken = (
    <Token
      className={classNames({
        AutoSummon: true,
        On: party.autoSummon,
        Off: !party.autoSummon,
      })}
    >
      {`${t('party.details.labels.auto_summon')} ${
        party.autoSummon ? 'On' : 'Off'
      }`}
    </Token>
  )

  const turnCountToken = (
    <Token>
      {t('party.details.turns.with_count', {
        count: party.turnCount,
      })}
    </Token>
  )

  const buttonChainToken = () => {
    if (party.buttonCount || party.chainCount) {
      let string = ''

      if (party.buttonCount && party.buttonCount > 0) {
        string += `${party.buttonCount}b`
      }

      if (!party.buttonCount && party.chainCount && party.chainCount > 0) {
        string += `0${t('party.details.suffix.buttons')}${party.chainCount}${t(
          'party.details.suffix.chains'
        )}`
      } else if (
        party.buttonCount &&
        party.chainCount &&
        party.chainCount > 0
      ) {
        string += `${party.chainCount}${t('party.details.suffix.chains')}`
      } else if (party.buttonCount && !party.chainCount) {
        string += `0${t('party.details.suffix.chains')}`
      }

      return <Token>{string}</Token>
    }
  }

  const clearTimeToken = () => {
    const minutes = Math.floor(party.clearTime / 60)
    const seconds = party.clearTime - minutes * 60

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
        {autoSummonToken}
        {party.turnCount ? turnCountToken : ''}
        {party.clearTime > 0 ? clearTimeToken() : ''}
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
          onClick={openRemixTeamAlert}
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
              <h1 className={party.name ? '' : 'empty'}>
                {party.name ? party.name : t('no_title')}
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

      <RemixTeamAlert
        creator={props.editable}
        name={partySnapshot.name ? partySnapshot.name : t('no_title')}
        open={remixAlertOpen}
        onOpenChange={handleRemixTeamAlertChange}
        remixCallback={remixTeamCallback}
      />

      <RemixedToast
        open={remixToastOpen}
        partyName={props.party?.name || t('no_title')}
        onOpenChange={handleRemixToastOpenChanged}
        onCloseClick={handleRemixToastCloseClicked}
      />
    </>
  )
}

export default PartyHeader
