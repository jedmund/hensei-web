import React, { useState } from 'react'
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

import RemixTeamAlert from '~components/dialogs/RemixTeamAlert'
import RemixedToast from '~components/toasts/RemixedToast'

import EditIcon from '~public/icons/Edit.svg'
import RemixIcon from '~public/icons/Remix.svg'
import SaveIcon from '~public/icons/Save.svg'

import type { DetailsObject } from 'types'

import styles from './index.module.scss'

// Props
interface Props {
  party?: Party
  new: boolean
  editable: boolean
  raidGroups: RaidGroup[]
  deleteCallback: () => void
  remixCallback: () => void
  updateCallback: (details: DetailsObject) => Promise<any>
}

const PartyHeader = (props: Props) => {
  const { party } = useSnapshot(appState)

  const { t } = useTranslation('common')
  const router = useRouter()
  const locale = router.locale || 'en'

  const { party: partySnapshot } = useSnapshot(appState)

  // State: Component
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [remixAlertOpen, setRemixAlertOpen] = useState(false)
  const [remixToastOpen, setRemixToastOpen] = useState(false)

  const userClass = classNames({
    [styles.user]: true,
    [styles.empty]: !party.user,
  })

  const linkClass = classNames({
    wind: party.element && party.element.slug === 'wind',
    fire: party.element && party.element.slug === 'fire',
    water: party.element && party.element.slug === 'water',
    earth: party.element && party.element.slug === 'earth',
    dark: party.element && party.element.slug === 'dark',
    light: party.element && party.element.slug === 'light',
  })

  // Actions: Favorites
  function toggleFavorite() {
    if (appState.party.social.favorited) unsaveFavorite()
    else saveFavorite()
  }

  function saveFavorite() {
    if (appState.party.id)
      api.saveTeam({ id: appState.party.id }).then((response) => {
        if (response.status == 201) appState.party.social.favorited = true
      })
    else console.error('Failed to save team: No party ID')
  }

  function unsaveFavorite() {
    if (appState.party.id)
      api.unsaveTeam({ id: appState.party.id }).then((response) => {
        if (response.status == 200) appState.party.social.favorited = false
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

  // Actions: Edit info
  function handleDetailsOpenChange(open: boolean) {
    setDetailsOpen(open)
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
    <Token active={party.details.chargeAttack} className="chargeAttack">
      {`${t('party.details.labels.charge_attack')} ${
        party.details.chargeAttack ? 'On' : 'Off'
      }`}
    </Token>
  )

  const fullAutoToken = (
    <Token active={party.details.fullAuto} className="fullAuto">
      {`${t('party.details.labels.full_auto')} ${
        party.details.fullAuto ? 'On' : 'Off'
      }`}
    </Token>
  )

  const autoGuardToken = (
    <Token active={party.details.autoGuard} className="autoGuard">
      {`${t('party.details.labels.auto_guard')} ${
        party.details.autoGuard ? 'On' : 'Off'
      }`}
    </Token>
  )

  const autoSummonToken = (
    <Token active={party.details.autoSummon} className="autoSummon">
      {`${t('party.details.labels.auto_summon')} ${
        party.details.autoSummon ? 'On' : 'Off'
      }`}
    </Token>
  )

  const turnCountToken = (
    <Token>
      {t('party.details.turns.with_count', {
        count: party.details.turnCount,
      })}
    </Token>
  )

  const buttonChainToken = () => {
    if (
      party.details.buttonCount !== undefined ||
      party.details.chainCount !== undefined
    ) {
      let string = ''

      if (party.details.buttonCount !== undefined) {
        string += `${party.details.buttonCount}b`
      }

      if (
        party.details.buttonCount === undefined &&
        party.details.chainCount !== undefined
      ) {
        string += `0${t('party.details.suffix.buttons')}${
          party.details.chainCount
        }${t('party.details.suffix.chains')}`
      } else if (
        party.details.buttonCount !== undefined &&
        party.details.chainCount !== undefined
      ) {
        string += `${party.details.chainCount}${t(
          'party.details.suffix.chains'
        )}`
      } else if (
        party.details.buttonCount !== undefined &&
        party.details.chainCount === undefined
      ) {
        string += `0${t('party.details.suffix.chains')}`
      }

      return <Token>{string}</Token>
    }
  }

  const clearTimeToken = () => {
    const minutes = Math.floor(party.details.clearTime / 60)
    const seconds = party.details.clearTime - minutes * 60

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
      <>
        {' '}
        {chargeAttackToken}
        {fullAutoToken}
        {autoSummonToken}
        {autoGuardToken}
        {party.details.turnCount !== undefined && turnCountToken}
        {party.details.clearTime > 0 && clearTimeToken()}
        {buttonChainToken()}
      </>
    )
  }

  // Render: Buttons
  const saveButton = () => {
    return (
      <Tooltip content={t('tooltips.save')}>
        <Button
          leftAccessoryIcon={<SaveIcon />}
          className={classNames({
            save: true,
            grow: true,
            saved: partySnapshot.social.favorited,
          })}
          text={
            appState.party.social.favorited
              ? t('buttons.saved')
              : t('buttons.save')
          }
          onClick={toggleFavorite}
        />
      </Tooltip>
    )
  }

  const remixButton = () => {
    return (
      <Tooltip content={t('tooltips.remix.create')}>
        <Button
          leftAccessoryIcon={<RemixIcon />}
          className="grow"
          text={t('buttons.remix')}
          onClick={openRemixTeamAlert}
        />
      </Tooltip>
    )
  }

  const remixedButton = () => {
    const tooltipString =
      party.social.remix && party.social.sourceParty
        ? t('tooltips.remix.source')
        : t('tooltips.remix.deleted')

    const buttonAction =
      party.social.sourceParty &&
      (() => goTo(party.social.sourceParty?.shortcode))

    return (
      <Tooltip content={tooltipString}>
        <Button
          blended={true}
          className="remixed"
          leftAccessoryIcon={<RemixIcon />}
          text={t('tokens.remix')}
          size="small"
          disabled={!party.social.sourceParty}
          onClick={buttonAction}
        />
      </Tooltip>
    )
  }

  return (
    <>
      <header className={styles.wrapper}>
        <section className={styles.info}>
          <div className={styles.left}>
            <div className={styles.header}>
              <h1 className={party.name ? '' : styles.empty}>
                {party.name ? party.name : t('no_title')}
              </h1>
              {party.social.remix && remixedButton()}
            </div>
            <div className={styles.attribution}>
              {renderUserBlock()}
              {appState.party.raid && linkedRaidBlock(appState.party.raid)}
              {party.timestamps.createdAt != '' && (
                <time
                  className={styles.lastUpdated}
                  dateTime={new Date(party.timestamps.createdAt).toString()}
                >
                  {formatTimeAgo(new Date(party.timestamps.createdAt), locale)}
                </time>
              )}
            </div>
          </div>
          {props.editable ? (
            <div className={styles.right}>
              <EditPartyModal
                open={detailsOpen}
                party={props.party}
                raidGroups={props.raidGroups}
                onOpenChange={handleDetailsOpenChange}
                updateParty={props.updateCallback}
              >
                <Button
                  className="full"
                  leftAccessoryIcon={<EditIcon />}
                  text={t('buttons.show_info')}
                />
              </EditPartyModal>
              {!props.new && (
                <PartyDropdown
                  editable={props.editable}
                  deleteTeamCallback={props.deleteCallback}
                  remixTeamCallback={props.remixCallback}
                />
              )}
            </div>
          ) : (
            <div className={styles.right}>
              {saveButton()}
              {remixButton()}
            </div>
          )}
        </section>
        <section className={styles.tokens}>{renderTokens()}</section>
      </header>

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
